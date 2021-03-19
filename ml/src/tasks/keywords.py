from typing import List, Dict, Union, Any, Tuple

from loguru import logger
import summa
import yake

try:
    import keybert
except ImportError:
    logger.info("[KEYWORDS] The KeyBERT keyword extractor is not available.")
    keybert = None


METHODS = {"bert", "summa", "yake"}
BERT_EMBEDDINGS = "distilbert-base-nli-mean-tokens"
BERT_SETTINGS = {
    "keyphrase_ngram_range": (3, 3),
    "stop_words": "english",
    "use_mmr": True,
    "diversity": 0.7,
}
YAKE_SETTINGS = {
    "n": 3,
    "top": 5,
    "dedupLim": 0.9,
    "dedupFunc": "seqm",
    "windowsSize": 2,
}
SUMMA_SETTINGS = {
    "words": 5,
    "ratio": 0.2,
    "scores": True,
}

_CACHE: Dict[
    str, Union["keybert.KeyBERT", "summa.keywords", "yake.KeywordExtractor"]
] = {}


def extract_keywords(
    text: str, method: str = "bert", settings: Dict[str, Any] = None
) -> List[Tuple[str, float]]:
    """
    Extracts keywords from the given text using the specified method.

    :param text: the text to extract keywords from.
    :param method: the method to use. Must be one of {"bert", "summa", "yake"}.
    :param settings: the settings that should be used with the given method
    :return: A list of tuples in the form (keyword, confidence).
    """
    if method not in METHODS:
        raise ValueError(f"Unsupported method: `{method}` (valid values are {METHODS}`")

    if method == "bert":
        if keybert is None:
            raise ModuleNotFoundError("The KeyBERT extractor is not available.")
        if method not in _CACHE:
            logger.debug("KeyBERT is not in cache, loading ...")
            _CACHE[method] = {
                "model": keybert.KeyBERT(BERT_EMBEDDINGS),
                "settings": settings or BERT_SETTINGS,
            }

        if settings is not None:
            _CACHE[method]["settings"] = settings

        model: "keybert.KeyBERT" = _CACHE[method]["model"]
        settings = _CACHE[method]["settings"]
        result = model.extract_keywords(text, **settings)

    elif method == "yake":
        if method not in _CACHE:
            logger.debug("Yake is not in cache, loading ...")
            settings = (settings or YAKE_SETTINGS)
            _CACHE[method] = { "model": yake.KeywordExtractor(**settings), "settings": settings }

        if settings is not None and _CACHE[method]["settings"] != settings:
            logger.debug("Yake settings have been changed, recreating the model...")
            stored = _CACHE[method]["settings"]
            stored.update(settings)
            _CACHE[method]["model"] = yake.KeywordExtractor(**stored)

        model: "yake.KeywordExtractor" = _CACHE[method]["model"]
        result = model.extract_keywords(text)

    elif method == "summa":
        if method not in _CACHE:
            _CACHE[method] = {}
            _CACHE[method]["settings"] = settings or SUMMA_SETTINGS
        if settings is not None:
            _CACHE[method]["settings"] = settings

        settings = _CACHE[method]["settings"]
        result = summa.keywords.keywords(text, **settings)
    else:
        raise NotImplementedError("This branch should be unreachable")

    return result
