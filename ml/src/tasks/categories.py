import gzip
import pickle
from pathlib import Path
from typing import Callable, List, Union, Tuple, Dict, Any


import numpy as np
import catboost as cb
import xgboost as xgb
import lightgbm as lgb
import Stemmer as py_stemmer

from loguru import logger
from sklearn.decomposition import TruncatedSVD
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import LabelEncoder

from src.tasks.common import preprocess_string, CATEGORIES

STEMMER = py_stemmer.Stemmer("english")

MODELS = Path(__file__).parent.parent.parent.joinpath("models")
CAT_URG_PATH = MODELS.joinpath("catboost_urgency_balanced_acc92.cbm")
XBG_URG_PATH = MODELS.joinpath("xgb_urgency_balanced_acc91.xbm")
LGB_CAT_PATH = MODELS.joinpath("lgb_categories_balanced.txt.gz")
REG_CAT_PATH = MODELS.joinpath("reg_categories_balanced_acc84.pkl")

TFIDF_PATH = MODELS.joinpath("tfidf.pkl")
SVD_PATH = MODELS.joinpath("svd1000.pkl")
ENCODER_PATH = MODELS.joinpath("label_encoder.pkl")

LGB_REG_URGENCY_WEIGHTS = [0.3, 0.7]
LGB_REG_CATEGORIES_WEIGHTS = [0.3, 0.7]

Vectorizer = Callable[[str, str], np.ndarray]
Classifier = Callable[[np.ndarray], np.ndarray]
_CACHE: Dict[str, Union[Vectorizer, Classifier, LabelEncoder]] = {}


def load_lgb(path: Path) -> lgb.Booster:
    """
    Loads a LightGBM booster ensemble.

    :param path: a path to an LGBM model.
    :return: loaded LGBM booster
    """
    if path.suffix == ".gz":
        with path.open(mode="rb") as f:
            data = gzip.decompress(f.read()).decode()
        return lgb.Booster(model_str=data)
    return lgb.Booster(model_file=str(path))


def load_xgb(path: Path) -> xgb.XGBClassifier:
    """
    Loads an XGBoost booster ensemble.

    :param path: a path to an LGBM model.
    :return: loaded LGBM booster
    """
    clf = xgb.XGBClassifier()
    clf.load_model(str(path))
    return clf


def load_cat(path: Path) -> cb.CatBoostClassifier:
    """
    Loads a CatBoost booster ensemble.

    :param path: a path to an LGBM model.
    :return: loaded LGBM booster
    """
    cat = cb.CatBoostClassifier()
    cat.load_model(str(path))
    return cat


def load_pickled(
    path: Path,
) -> Union[LogisticRegression, TfidfVectorizer, TruncatedSVD, LabelEncoder]:
    """
    Loads the pickled model at the given path.

    :param path: a path to a pickled model
    :return: one of the four supported models
    """
    return pickle.load(path.open(mode="rb"))


def load_vectorizer(
    stemmer: py_stemmer.Stemmer, vectorizer: Path = TFIDF_PATH, svd: Path = SVD_PATH
) -> Tuple[Callable[[List[str]], np.ndarray], Callable[[str, str], np.ndarray]]:
    """
    Loads and constructs a TF-IDF + TruncatedSVD text vectorizer that outputs a real-valued vector of size (1, 2000).

    :param stemmer: a stemmer instance that will be used to stem each tokenized word
    :param vectorizer: the path to the pickled TF-IDF model
    :param svd: the path to the pickled TSVD model
    :return: a tuple of (vectorize_many, vectorize_one) vectorizer functions
    """
    vectorizer: TfidfVectorizer = load_pickled(vectorizer)
    vectorizer.analyzer = lambda s: preprocess_string(s, stemmer)
    svd: TruncatedSVD = load_pickled(svd)

    def vectorize_many(strings: List[str]) -> np.ndarray:
        vectors = vectorizer.transform(strings)
        return svd.transform(vectors)

    def vectorize(title: str, body: str) -> np.ndarray:
        if not title:
            title = body
        vectors = vectorize_many([title, body])
        in_features = np.hstack(vectors)
        return in_features.reshape((1, 2000))

    return vectorize_many, vectorize


def blend(
    data: np.ndarray,
    classifiers: List[Callable[[np.ndarray], np.ndarray]],
    weights: List[float] = None,
) -> np.ndarray:
    """
    Blends the predictions produced by the given classifies using a weighted average.
    The classifiers must predict vectors of probabilities.

    :param data: a dataset to predict on
    :param classifiers: a list of callable classifiers
    :param weights: a list of weights that will be applied to each classifier's prediction
    :return: a matrix of probabilities obtained after averaging the predictions of the classifies
    """
    if not weights:
        weights = np.ones(len(classifiers))
    return np.mean([clf(data) * w for clf, w in zip(classifiers, weights)], axis=0)


def load_models():
    """
    Loads the ML models used to preprocess tickets and make urgency and category predictions.

    :return: tuple (encoder, vectorizer, urgency classifier, category classifier)
    """
    logger.info("[CATEGORIES] Loading the encoder ...")
    encoder = load_pickled(ENCODER_PATH)

    logger.info("[CATEGORIES] Loading the vectorizer ...")
    (_vectorize_many, vectorize_one) = load_vectorizer(STEMMER, TFIDF_PATH, SVD_PATH)

    logger.info("[CATEGORIES] Loading the regression models ...")
    reg_categories = load_pickled(REG_CAT_PATH)

    logger.info("[CATEGORIES] Loading the boosting models ...")
    xgb_urgency = load_xgb(XBG_URG_PATH)
    cat_urgency = load_cat(CAT_URG_PATH)
    lgb_categories = load_lgb(LGB_CAT_PATH)

    def build_classifier(
        first: Classifier, second: Classifier, weights: List[float]
    ) -> Callable[[np.ndarray], np.ndarray]:
        def classifier(vectors: np.ndarray) -> np.ndarray:
            return blend(vectors, [first, second], weights=weights)

        return classifier

    urgency_clf = build_classifier(
        xgb_urgency.predict_proba, cat_urgency.predict_proba, LGB_REG_URGENCY_WEIGHTS
    )
    category_clf = build_classifier(
        reg_categories.predict_proba, lgb_categories.predict, LGB_REG_CATEGORIES_WEIGHTS
    )
    return encoder, vectorize_one, urgency_clf, category_clf


def predict_categories(
    title: str, body: str, _settings: Dict[str, Any] = None
) -> List[Tuple[str, float]]:
    """
    Predicts the urgency and category of the given ticket.

    :param title: The tile string of the given ticket.
    :param method: The text of the given ticket.
    :param settings: currently ignored
    :return: A list of tuples in the form (prediction, confidence).
    """
    vectorizer: Vectorizer = _CACHE.get("vectorizer")
    if not vectorizer:
        logger.info("[CATEGORIES] Models not in cache, loading ...")
        encoder, vectorizer, urgency, category = load_models()
        _CACHE["encoder"] = encoder
        _CACHE["vectorizer"] = vectorizer
        _CACHE["urgency"] = urgency
        _CACHE["category"] = category
    else:
        encoder: LabelEncoder = _CACHE["encoder"]
        urgency: Classifier = _CACHE["urgency"]
        category: Classifier = _CACHE["category"]

    logger.info("[CATEGORIES] Tokenizing the ticket ...")
    vectors = vectorizer(title, body)

    logger.info("[CATEGORIES] Predicting the ticket's urgency ...")
    urgency_pred = urgency(vectors)
    u_value, u_cls = urgency_pred[0].max(), urgency_pred[0].argmax()

    logger.info("[CATEGORIES] Predicting the ticket's category ...")
    category_pred = category(vectors)
    c_value, c_cls = category_pred[0].max(), category_pred[0].argmax()

    decoded = encoder.inverse_transform([c_cls])[0]
    return [(u_cls, u_value), (CATEGORIES[decoded], c_value)]


if __name__ == "__main__":
    assert (
        predict_categories(
            "Equipment problem",
            "Hello, please help me with the following equipment: laptop, phone",
        )[1][0]
        == "hardware"
    )
    assert (
        predict_categories(
            "Security badge lost",
            "Hello I've lost my security badge. I'd like to get a replacement",
        )[1][0]
        == "access card"
    )
