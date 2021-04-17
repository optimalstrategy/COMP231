from src.tasks.categories import predict_categories


def test_predict_categories():
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
