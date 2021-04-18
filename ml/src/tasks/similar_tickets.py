import contextlib
from typing import Any, Dict, Union, Tuple

import numpy as np
import pandas as pd
import strsimpy as sim
from loguru import logger
from scipy.spatial import distance

from src.tasks.categories import STEMMER, load_vectorizer


METRICS = {
    "cosine",
    "euclidean",
}
CONFIG = {"n": 5, "threshold": 0.55, "metric": "cosine", "exclude_same": False}
EPSILON = 1e-10


class TicketDB(object):
    """
    A database that stores the recently processed similar tickets in memory.
    Can perform ticket similarity search queries.
    """

    def __init__(self):
        self.db = pd.DataFrame(columns=["ticket_id", "features", "headline", "body"])
        self.config = CONFIG.copy()
        self.vectorizer = None

    def update_config(self, new_config: Dict[str, Any]):
        """
        Updates the config used by the database to the given :param:`new_config`.

        :param new_config: the new config to use.
        """
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
        """
        Adds a new ticket to the database, computing its vectors.

        :param ticket_id: the id of the ticket to add
        :param title: the title of the ticket to add
        :param body: the body of the ticket to add
        """
        if self.vectorizer is None:
            logger.info("[SIMILAR] Vectorizer is not in cache, loading ...")
            _, self.vectorizer = load_vectorizer(STEMMER)

        vectors = self.vectorizer(title, body)
        self.add_ticket_vectors(ticket_id, vectors, title, body)

    def add_ticket_vectors(self, ticket_id: str, vectors: np.ndarray, headline: str = "", body: str = ""):
        """
        Adds the ticket using the user-supplied vectors.

        :param ticket_id: the id of the ticket to add
        :param vectors: the embedding vectors to associate with the user.
        :param headline: the ticket headline
        :param body: the ticket body
        :return:
        """
        existing = self.db[self.db.ticket_id == ticket_id]

        if len(existing) == 0:
            self.db.loc[len(self.db)] = [ticket_id, vectors, headline, body]
        else:
            self.db.loc[existing] = [ticket_id, vectors, headline, body]

    def find_similar_tickets(
        self,
        vectors_or_id: Union[str, Tuple[str, np.ndarray]],
        n: int = None,
        metric: str = None,
        threshold: float = None,
        exclude_same: bool = None,
    ):
        """
        Finds the tickets similar to the given embedding or ticket id.

        :param vectors_or_id: either a ticket id or a tuple of (ticket_id, vectors)
        :param n: the maximum number of similar tickets to return
        :param metric: the metric to use for similarity calculation
        :param threshold: the similarity threshold for ticket selection
        :param exclude_same: whether to exclude the tickets that _too_ similar (the distance between them is < EPSILON)

        :return: a list of tuples [(ticket_id, similarity)]
        """
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

        if not result:
            result = self.cosine_fallback(ticket_id, threshold or self.config["threshold"])

        logger.info(
            f"[SIMILAR] Found {len(closest)} neighbors, filtered out {len(result)} that are close enough."
        )

        return result

    def cosine_fallback(self, ticket_id: str, threshold: float):
        """
        A fallback implementation that uses a simpler ticket embedding algorithm that works by computing 3-grams.

        :param ticket_id: the id of the target ticket
        :param threshold: the similarity threshold
        :return: a list of tuples [(ticket_id, similarity)]
        """
        cosine = sim.cosine.Cosine(3)
        ticket = self.db[self.db.ticket_id == ticket_id].body.values[0]
        profile = cosine.get_profile(ticket)

        results = []
        for other_id, _, _, body in self.db.values:
            if other_id == ticket_id or not body: continue
            other_profile = cosine.get_profile(body)
            try:
                measure = cosine.similarity_profiles(profile, other_profile)
            except ZeroDivisionError:
                continue
            if measure >= threshold:
                results.append((other_id, measure))

        return results

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
    """
    A dummy context manager that does nothing. Used as a stub if a lock isn't passed.
    """
    yield


def add_predict(
    db: TicketDB, ticket_id: str, title: str, body: str, settings=None, lock=None
):
    """
    Performs a similarity prediction on the given ticket, locking the call if necessary
    (since the database isn't thread-safe by itself).

    :param db: the ticket db to use for predictions
    :param ticket_id: the if id of the ticket
    :param title: the title of the ticket
    :param body: the body of the ticket
    :param settings: the settings to use when computing similarity
    :param lock: the lock to use if thread-safety is desired
    :return: a list of tuples [(ticket_id, similarity)]
    """
    if not lock:
        lock = dummy

    with lock:
        if settings:
            db.update_config(settings)

        db.add_ticket(ticket_id, title, body)
        return db.find_similar_tickets(ticket_id)
