import json
import asyncio
from asyncio.locks import Semaphore
from queue import Queue
from typing import Dict, Any

from loguru import logger
from aio_pika import connect, IncomingMessage, Exchange, Message

try:
    from tasks import keywords
    from propagating_thread import PropagatingThread
except ImportError:
    from .tasks import keywords
    from .propagating_thread import PropagatingThread


AMQP_URL = "amqp://guest:guest@localhost/"
AMQP_EXCHANGE_NAME = "comp231"
QUEUE_NAME = "comp231_ml_tasks"
REPLY_TO_QUEUE = "comp231_rpc_reply_to"

MAX_ML_PROCESSES = 4
ML_PROC_SEMAPHORE = Semaphore(MAX_ML_PROCESSES)


async def on_message(exchange: Exchange, message: IncomingMessage):
    with message.process():
        context = {}
        try:
            await process_message(exchange, message, context)
        except Exception as e:
            logger.exception("Failed to process the message with following error:\n")
            logger.info("[E] Sending a reply with the error information.")
            extra = "Make sure that the message payload was valid."
            if type(e) is TypeError:
                extra = "It is likely that the supplied settings/parameters were invalid."
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


async def process_message(exchange: Exchange, message: IncomingMessage, context: Dict[str, Any]):
    logger.info(" [x] Received a new ticket %r" % message)
    logger.info(" [x] Ticket description is: %r" % message.body)

    ticket = json.loads(message.body)
    context["ticket_id"] = ticket.get("ticket_id", "<error: missing ticket_id>")

    settings = {"keywords": {"method": "bert", "parameters": None}}
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
                target=lambda q, *rest: q.put(keywords.extract_keywords(*rest)),
                args=(
                    q,
                    ticket["body"],
                    settings["keywords"]["method"],
                    settings["keywords"]["parameters"],
                ),
            )
        ]
        for t in threads:
            t.start()
        for t in threads:
            t.join()

        ticket_keywords = q.get()

    results = {
        "status": "OK",
        "ticket_id": ticket["ticket_id"],
        "results": {"keywords": ticket_keywords},
        "settings": settings,
    }

    logger.info("[x] Finished processing the ticket: {}", results)

    await exchange.publish(
        Message(
            json.dumps(results).encode(),
            content_type="application/json",
            correlation_id=message.correlation_id,
            reply_to=message.reply_to,
        ),
        message.reply_to,
    )


async def main(loop: asyncio.AbstractEventLoop) -> None:
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
