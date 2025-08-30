public class tuple<T, U> {
    private final T first;
    private final U second;

    public tuple(T f, U s) {
        this.first = f;
        this.second = s;
    }
    public T f() {
        return this.first;
    }
    public U s() {
        return this.second;
    }

    @Override
    public String toString() {
        return "(" + this.first + ", " + this.second + ")";
    }
}
