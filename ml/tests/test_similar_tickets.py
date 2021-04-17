import numpy as np
from src.tasks.similar_tickets import TicketDB


def test_ticket_db():
    db = TicketDB()

    db.add_ticket_vectors("t0", np.array([0, 1, 2, 3, 4]))

    db.add_ticket_vectors("t1", np.array([0, 1, 2, 3, 0]))
    db.add_ticket_vectors("t2", np.array([10, 77, 77, 88, -100]))
    db.add_ticket_vectors("t3", np.array([-3.121, 1, 31822, 28182.021, -5000]))
    db.add_ticket_vectors("t4", np.array([-3.121, 1, 31822, 28182.021, -5000]))
    db.add_ticket_vectors("t5", np.array([0, 1, 1, 3, 2]))
    db.add_ticket_vectors("t6", np.array([0, 1, 1, 3, 2]))

    assert db.find_similar_tickets("t6") == [
        ("t5", 0.9999999999999999),
        ("t0", 0.9428090415820634),
    ]
    assert db.find_similar_tickets("t6", exclude_same=True) == [
        ("t0", 0.9428090415820634)
    ]


def test_ticket_db_with_real_vectors():
    db = TicketDB()
    db.add_ticket(
        "t0",
        "Security badge lost",
        "Hello I've lost my security badge. I'd like to get a replacement",
    )
    db.add_ticket(
        "t1",
        "Security badge lost",
        "Hello I've lost my security badge. I'd like to get a replacement.",
    )
    assert db.find_similar_tickets("t0") == [("t1", 1.0)]

    db.add_ticket("t2", "An unrelated ticket", "Completely unrelated description")
    assert db.find_similar_tickets("t2") == []
