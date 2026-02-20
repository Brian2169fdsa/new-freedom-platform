## Interfaces
The types and functions defined here are involved in handling requests and responses throughout the code base.

## RequestConfig
Each callable or public function should have a request config defined for it.  It consists of a few fields.
- name: the name of the function, used for error output
- contextOptions: processing instructions for the wrapper function, see more details below
- schema: The fully-defined schema used to validate the request input, normally defined in src/models

## ContextOptions
Currently this can only be used to enable auth userId lookups.  In the future it will be used
to also pull up the user object, if desired.  This is all optional, reusable functionality that
can be shared between requests.

## CallHandler
This is the wrapper function used to define a callable request. Pass in the request config and handler function.
The handler function will be called with fully validated input (or an exception will be thrown). The
handler will also be called with a context object, which contains any requested features from
the context options defined in the request config.

## RequestHandler
Identical to CallHandler except it is set up to be a wrapper function for public requests.

## ResponseBase
Intended to be a basic common starting point for response data structures.