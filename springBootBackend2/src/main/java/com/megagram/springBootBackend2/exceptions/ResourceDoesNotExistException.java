package com.megagram.springBootBackend2.exceptions;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;


@ResponseStatus(HttpStatus.NOT_FOUND)
public class ResourceDoesNotExistException extends RuntimeException {


    public ResourceDoesNotExistException(String message) {
        super(message);
    }
}