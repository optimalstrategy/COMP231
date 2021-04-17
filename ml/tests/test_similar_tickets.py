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
        ("t1", 0.8280786712108251),
        ("t3", 0.6416864263575349),
        ("t4", 0.6416864263575349),
    ]
    assert db.find_similar_tickets("t6", exclude_same=True) == [
        ("t0", 0.9428090415820634),
        ("t1", 0.8280786712108251),
        ("t3", 0.6416864263575349),
        ("t4", 0.6416864263575349),
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
        "Security Card Went Missing",
        "Hello. I've lost my access card. I'd like to get a new one.",
    )
    assert db.find_similar_tickets("t0") == [("t1", 0.5761659596980319)]

    db.add_ticket("t2", "An unrelated ticket", "Completely unrelated description")
    assert db.find_similar_tickets("t2") == []
