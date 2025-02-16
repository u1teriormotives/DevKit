import EventObject, { Event } from "./Events";

export default class EventTarget {
  private target: Event;
  private readonly listeners: Set<Event> = new Set<Event>();

  constructor() {}

  public addEventListener(event: Event, callback: (event: EventObject) => void): void {
    callback(new EventObject(event));
    this.listeners.add(event);
  }
  public removeEventListener(event: Event): boolean {
    return this.listeners.delete(event);
  }
  public dispatchEvent(event: Event): void {
    this.target = event;
  }
}