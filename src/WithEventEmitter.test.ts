import { WithEventEmitter } from "./WithEventEmitter";
import flushPromises from "flush-promises";

// Sample Events interface for testing
interface Events {
    foo(a: number, b: boolean): void;
}

// Sample class that extends WithEventEmitter for testing
class Widget extends WithEventEmitter<Events> {
    public constructor() {
        // Helps validate that EventEmitter constructor params are passed through
        super();
    }

    // Helps validate that the class inherits access topublishing events
    public triggerFoo(a: number, b: boolean): void {
        this.emit.foo(a, b);
    }
}

// Exhaustive testing is not necessary because WithEventEmitter is a simple
// pass-through to an EventEmitter instance. We only need to cover the basics:
// - Can subscribe via methiod inherited from WithEventEmitter.
// - Subscription options are applied.
// - Can cancel subscriptions.
// - Can emit events via `emit` property inherited from WithEventEmitter.
test("General sanity check", async () => {
    const widget = new Widget();

    const fooAlways = jest.fn();
    const fooCancelled = jest.fn();
    const fooOnce = jest.fn();
    const fooPromiseHandler = jest.fn();

    widget.subscribe({
        foo: fooAlways,
    });

    // Will be cancelled.
    // Also testing short-hand subscription to a single event.
    const cancel = widget.on("foo", fooCancelled);

    // One-time only subscription
    // (validating that subscription options are passed through)
    widget.once("foo", fooOnce);

    widget.onceAsPromise("foo").then(fooPromiseHandler);

    widget.triggerFoo(42, true);
    await flushPromises();

    // All handlers called by first emit
    expect(fooAlways).toHaveBeenCalledTimes(1);
    expect(fooAlways).toHaveBeenLastCalledWith(42, true);
    expect(fooCancelled).toHaveBeenCalledTimes(1);
    expect(fooCancelled).toHaveBeenLastCalledWith(42, true);
    expect(fooOnce).toHaveBeenCalledTimes(1);
    expect(fooOnce).toHaveBeenLastCalledWith(42, true);
    expect(fooPromiseHandler).toHaveBeenCalledTimes(1);
    expect(fooPromiseHandler.mock.calls[0][0][0]).toBe(42);
    expect(fooPromiseHandler.mock.calls[0][0][1]).toBe(true);

    widget.triggerFoo(1337, false);

    // Still-subscribed handlers called
    expect(fooAlways).toHaveBeenCalledTimes(2);
    expect(fooAlways).toHaveBeenLastCalledWith(1337, false);
    expect(fooCancelled).toHaveBeenCalledTimes(2);
    expect(fooCancelled).toHaveBeenLastCalledWith(1337, false);
    // One-time subscription not called again
    expect(fooOnce).toHaveBeenCalledTimes(1);
    expect(fooPromiseHandler).toHaveBeenCalledTimes(1);

    cancel();
    widget.triggerFoo(-1, true);

    // Still-subscribed handler called
    expect(fooAlways).toHaveBeenCalledTimes(3);
    expect(fooAlways).toHaveBeenLastCalledWith(-1, true);
    // Cancelled handler not called again
    expect(fooCancelled).toHaveBeenCalledTimes(2);
    // One-time subscription not called again
    expect(fooOnce).toHaveBeenCalledTimes(1);
    expect(fooPromiseHandler).toHaveBeenCalledTimes(1);
});
