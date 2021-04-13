from threading import Thread, Lock


class PropagatingThread(Thread):
    """
    A wrapper over threading.Thread that returns the result of its execution
    and propagates exceptions to the main thread.
    """

    def run(self):
        self.exc = None
        self.ret = None
        try:
            self.ret = super().run()
        except BaseException as e:
            self.exc = e

    def join(self, **kwargs):
        super().join(**kwargs)
        if self.exc:
            raise self.exc
        return self.ret


__all__ = ["PropagatingThread", "Lock"]
