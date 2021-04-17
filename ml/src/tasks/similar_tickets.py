import contextlib
from typing import Any, Dict, Union, Tuple

import numpy as np
import pandas as pd
from loguru import logger
from scipy.spatial import distance

from src.tasks.categories import STEMMER, load_vectorizer


METRICS = {
    "cosine",
    "euclidean",
}
CONFIG = {"n": 5, "threshold": 0.90, "metric": "cosine", "exclude_same": False}
EPSILON = 1e-10


class TicketDB(object):
    def __init__(self):
        self.db = pd.DataFrame(columns=["ticket_id", "features"])
        self.config = CONFIG.copy()
        self.vectorizer = None

    def update_config(self, new_config: Dict[str, Any]):
        for key in filter(lambda k: k in self.config, new_config):
            value = new_config[key]
            if key == "metric" and value in METRICS:
                self.config[key] = value
            elif key == "n" and value < len(self.db):
                self.config[key] = value
            elif key == "threshold" and value >= 0 and value <= 1.0:
                self.config[key] = value
            elif key == "exclude_same":
                self.config[key] = bool(value)

    def add_ticket(self, ticket_id: str, title: str, body: str):
        if self.vectorizer is None:
            logger.info("[SIMILAR] Vectorizer is not in cache, loading ...")
            _, self.vectorizer = load_vectorizer(STEMMER)

        vectors = self.vectorizer(title, body)
        self.add_ticket_vectors(ticket_id, vectors)

    def add_ticket_vectors(self, ticket_id: str, vectors: np.ndarray):
        existing = self.db[self.db.ticket_id == ticket_id]

        if len(existing) == 0:
            self.db.loc[len(self.db)] = [ticket_id, vectors]
        else:
            self.db.loc[existing] = vectors

    def find_similar_tickets(
        self,
        vectors_or_id: Union[str, Tuple[str, np.ndarray]],
        n: int = None,
        metric: str = None,
        threshold: float = None,
        exclude_same: bool = None,
    ):
        if type(vectors_or_id) is str:
            ticket_id = vectors_or_id
            vectors = (
                self.db[self.db.ticket_id == vectors_or_id]
                .features.values[0]
                .astype(np.float32)
            )
        else:
            ticket_id, vectors = vectors_or_id
            self.add_ticket_vectors(ticket_id, vectors)

        features = self._reshape(np.stack(self.db.features.values))
        vectors = self._reshape(vectors)

        distances = distance.cdist(
            features,
            vectors,
            metric=metric or self.config["metric"],
        )
        indices = distances.argsort(axis=0)[: (n or self.config["n"]) + 1]

        closest = self.db.ticket_id.values[indices].reshape(-1)
        closest_distances = distances[indices].reshape(-1)

        exclude_same = exclude_same or self.config["exclude_same"]
        result = []
        for ticket, dist in zip(closest, closest_distances):
            measure = max(1, abs(dist)) - abs(dist)

            if (
                ticket_id != ticket
                and measure >= (threshold or self.config["threshold"])
                and (not exclude_same or exclude_same and (1 - measure) > EPSILON)
            ):
                result.append((ticket, measure))

        logger.info(
            f"[SIMILAR] Found {len(closest)} neighbors, filtered out {len(result)} that are close enough."
        )

        return result

    def _reshape(self, v: np.ndarray) -> np.ndarray:
        if len(v.shape) == 1:
            shape = (1,) + v.shape
        elif len(v.shape) == 3:
            shape = (v.shape[0], v.shape[2])
        else:
            return v
        return v.reshape(shape)


@contextlib.contextmanager
def dummy():
    yield


def add_predict(
    db: TicketDB, ticket_id: str, title: str, body: str, settings=None, lock=None
):
    if not lock:
        lock = dummy

    with lock:
        if settings:
            db.update_config(settings)

        db.add_ticket(ticket_id, title, body)
        return db.find_similar_tickets(ticket_id)
