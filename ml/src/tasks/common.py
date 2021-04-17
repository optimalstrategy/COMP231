import re

import numpy as np
import pandas as pd
import Stemmer as py_stemmer
from typing import Callable, List, Any

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

DESCRIPTION_REGEX = re.compile(r"(\W|\d)+")


def load_data(path: str = DATA_PATH) -> pd.DataFrame:
    """
    Loads the ticket dataset at the given path and filters out the categories with extremely low sample counts.

    :param path: a path to load the dataset from
    :return: loaded dataset
    """
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
    """
    Clears the input string by removing the unexpected characters and redundant whitespace.

    :param s: a string to clean
    :return: cleaned string
    """
    return DESCRIPTION_REGEX.sub(" ", s).strip()


def preprocess_string(
    s: str,
    stemmer: py_stemmer.Stemmer,
    tokenizer: Callable[[str], np.array] = CountVectorizer(
        ngram_range=(2, 2)
    ).build_analyzer(),
) -> List[str]:
    """
    Tokenizes the given string into (2, 2) ngrams, stemming every word in the process.

    :param s: the string to preprocess
    :param stemmer: a tokenizer instance
    :param tokenizer: a tokenizer function (CountVectorizer(ngram_range=(2, 2)) default)
    :return: string tokens
    """
    return [
        " ".join(stemmer.stemWords(gram.split()))
        for gram in tokenizer(clean_input_string(s))
    ]


def convert(o: Any):
    """
    A helper that converts numpy types to python types.

    :param o: an object to convert
    :return:
    """
    if isinstance(o, np.int64):
        return int(o)
    if isinstance(o, np.float32):
        return float(o)
    raise TypeError
