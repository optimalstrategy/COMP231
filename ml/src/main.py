import json
import asyncio
from asyncio.locks import Semaphore
from queue import Queue, Empty
from typing import Dict, Any

from loguru import logger
from aio_pika import connect, IncomingMessage, Exchange, Message

try:
    from tasks import keywords, similar_tickets, categories, common
    from propagating_thread import PropagatingThread, Lock
except ImportError:
    from .tasks import keywords, similar_tickets, categories, common
    from .propagating_thread import PropagatingThread, Lock


#: The AMQP connection url to use
AMQP_URL = "amqp://guest:guest@localhost/"
#: The name of the AMQP exchange used for communication
AMQP_EXCHANGE_NAME = "comp231"
#: The name of the queue that contains the tasks to do
QUEUE_NAME = "comp231_ml_tasks"
#: The name of the queue to reply to
REPLY_TO_QUEUE = "comp231_rpc_reply_to"

#: The maximum number of ML processes that can be spawned in parallel
#: (currently isn't every useful as threads block the event loop).
MAX_ML_PROCESSES = 4
ML_PROC_SEMAPHORE = Semaphore(MAX_ML_PROCESSES)
DB = similar_tickets.TicketDB()
DB_LOCK = Lock()


async def on_message(exchange: Exchange, message: IncomingMessage):
    """
    Handles an incoming ticket processing message. Marks the message as processed
    even if the processing fails (the user must re-request the processing of the same ticket in this case).

    :param exchange: the exchange to reply to
    :param message: the message to handle
    """
    with message.process():
        context = {}
        try:
            await process_message(exchange, message, context)
        except Exception as e:
            logger.exception("Failed to process the message with following error:\n")
            logger.info("[E] Sending a reply with the error information.")
            extra = "Make sure that the message payload was valid."
            if type(e) is TypeError:
                extra = (
                    "It is likely that the supplied settings/parameters were invalid."
                )
            await exchange.publish(
                Message(
                    json.dumps(
                        {
                            "status": "ERROR",
                            "error": f"An exception occurred while processing the ticket. {extra}",
                            "ticket_id": context.get("ticket_id"),
                            "message": message.body.decode(errors="ignore"),
                        }
                    ).encode(),
                    content_type="application/json",
                    correlation_id=message.correlation_id,
                    reply_to=message.reply_to,
                ),
                message.reply_to,
            )


async def process_message(
    exchange: Exchange, message: IncomingMessage, context: Dict[str, Any]
):
    """
    Processes a ticket processing request received from the queue.

    :param exchange: The exchange to reply to.
    :param message:  The received message containing the ticket information.
    :param context: The context that well be sent to the user if an error occurs.
    :return:
    """
    logger.info(" [x] Received a new ticket %r" % message)
    logger.info(" [x] Ticket description is: %r" % message.body)

    ticket = json.loads(message.body)
    context["ticket_id"] = ticket.get("ticket_id", "<error: missing ticket_id>")

    settings = {
        "keywords": {"method": "bert", "parameters": None},
        "similar_tickets": {**DB.config},
    }
    settings = {**settings, **(ticket.get("settings", {}) or {})}

    logger.info(
        "[-] Preparing to spawn the ML tasks (semaphore counter = {})",
        ML_PROC_SEMAPHORE._value,
    )
    async with ML_PROC_SEMAPHORE:
        # TODO: rewrite this
        # This is not super optimal because we lose the advantages of async
        # while this section is running. A better solution would be to have a separate
        # process per task that we could wait for here.
        q = Queue()
        threads = [
            PropagatingThread(
                target=lambda q, *rest: q.put(
                    {"task": "keywords", "result": keywords.extract_keywords(*rest)}
                ),
                args=(
                    q,
                    ticket["body"],
                    settings["keywords"]["method"],
                    settings["keywords"]["parameters"],
                ),
            ),
            PropagatingThread(
                target=lambda q, *rest: q.put(
                    {"task": "similar", "result": similar_tickets.add_predict(*rest)}
                ),
                args=(
                    q,
                    DB,
                    ticket["ticket_id"],
                    ticket["headline"],
                    ticket["body"],
                    settings["similar_tickets"],
                    DB_LOCK,
                ),
            ),
            PropagatingThread(
                target=lambda q, *rest: q.put(
                    {
                        "task": "categories",
                        "result": categories.predict_categories(*rest),
                    }
                ),
                args=(
                    q,
                    ticket["headline"],
                    ticket["body"],
                ),
            ),
        ]

        for t in threads:
            t.start()

        for t in threads:
            t.join()

        ticket_keywords = []
        similar = []
        predicted_categories = []
        while True:
            try:
                result = q.get_nowait()
                task = result["task"]
                result = result["result"]

                if task == "keywords":
                    ticket_keywords = result
                elif task == "similar":
                    similar = result
                elif task == "categories":
                    predicted_categories = result
                else:
                    raise NotImplementedError(f"Unexpected task type {task}")

            except Empty:
                break

    results = {
        "status": "OK",
        "ticket_id": ticket["ticket_id"],
        "results": {
            "keywords": ticket_keywords,
            "similar": similar,
            "categories": predicted_categories,
        },
        "settings": settings,
    }

    logger.info("[x] Finished processing the ticket: {}", results)

    await exchange.publish(
        Message(
            json.dumps(results, default=common.convert).encode(),
            content_type="application/json",
            correlation_id=message.correlation_id,
            reply_to=message.reply_to,
        ),
        message.reply_to,
    )


async def main(loop: asyncio.AbstractEventLoop) -> None:
    """
    Listens and handles the incoming processing.

    :param loop: the asyncio even loop to run on
    """
    connection = await connect("amqp://guest:guest@localhost/", loop=loop)

    channel = await connection.channel()
    await channel.set_qos(prefetch_count=1)
    exchange = channel.default_exchange

    queue = await channel.declare_queue(QUEUE_NAME, durable=False)
    _reply_queue = await channel.declare_queue(REPLY_TO_QUEUE, durable=True)

    async def with_exchange(f, exchange: Exchange):
        async def wrapper(message: Message):
            return await f(exchange, message)

        return wrapper

    await queue.consume(await with_exchange(on_message, exchange), no_ack=False)


if __name__ == "__main__":
    logger.info("Starting up the worker...")

    loop = asyncio.get_event_loop()
    loop.create_task(main(loop))

    print(" [*] Waiting for messages. To exit press CTRL+C")
    loop.run_forever()
