import re

import numpy as np
import pandas as pd
import Stemmer as py_stemmer
from typing import Callable, List

from sklearn.feature_extraction.text import CountVectorizer

DATA_PATH = "../data/all_tickets.csv"

RANDOM_STATE = 0

PRIORITY_COLUMN = "urgency"
MIN_CATEGORY_COUNT = 150
TICKET_TYPES = {0: "incident", 1: "request"}
CATEGORIES = {
    0: "lacking information",
    6: "access",
    5: "hardware",
    4: "action",
    7: "location",
    11: "access card",
    8: "database",
    9: "purchase",
}

DESCRIPTION_REGEX = re.compile("(\W|\d)+")


def load_data(path: str = DATA_PATH) -> pd.DataFrame:
    df = pd.read_csv(path)

    selected_categories = set(
        map(
            lambda c: c[0],
            filter(
                lambda i: i[1] >= MIN_CATEGORY_COUNT,
                enumerate(df.category.value_counts().sort_index().values),
            ),
        )
    )

    df = df[df.category.isin(selected_categories)]
    df = df.drop(["sub_category1", "sub_category2", "business_service"], axis=1)
    df["title"] = df.title.fillna("")
    df = df[~df.title.isna()]
    return df


def clean_input_string(s: str) -> str:
    return DESCRIPTION_REGEX.sub(" ", s).strip()


def preprocess_string(
    s: str,
    stemmer: py_stemmer.Stemmer,
    tokenizer: Callable[[str], np.array] = CountVectorizer(
        ngram_range=(2, 2)
    ).build_analyzer(),
) -> List[str]:
    return [
        " ".join(stemmer.stemWords(gram.split()))
        for gram in tokenizer(clean_input_string(s))
    ]
