package devkit.web.interfaces

open public class Event {
    private var bubbles: Boolean = false
    private var cancelable: Boolean = false
    private var composed: Boolean = false
    private var currentTarget: EventTypes? = null
    private var defaultPrevented: Boolean = false
    private var eventPhase: EventPhase = EventPhase.NONE
    private var isTrusted: Boolean = true
    private var target: EventTarget? = null
    private var timeStamp: Long = 0L
    private var type: EventTypes? = null

    public fun composedPath(): Array<Any> {}
    public fun preventDefault(): Unit {
        this.defaultPrevented = true
    }
    public fun stopImmediatePropagation(): Unit {}
    public fun stopPropagation(): Unit {}
}