#!/bin/bash

case "$1" in
setup)
    case "$2" in
    route)
        ./route -c
        ;;
    esac
    ;;
install)
    case "$2" in
    route)
        case "$3" in
        js|javascript)
            /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/u1t-dev/DevKit/refs/heads/main/Request%20Routing/JS/install.sh)"
            ;;
        esac
        ;;
    esac
    ;;
esac
