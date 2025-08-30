package devkit.web.interfaces

open public class EventTarget {
    fun addEventListener(event: EventTypes, callback: (Event) -> Unit) {}
    fun removeEventListener(event: EventTypes, callback: (Event) -> Unit) {}
    fun dispatchEvent(eventName: String, callback: (Event) -> Unit) {}
}