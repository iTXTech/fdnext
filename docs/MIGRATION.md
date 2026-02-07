# Migration Notes

## Behavioral compatibility

- HTTP paths and key response envelopes are preserved
- language keys and summary placeholders are reused from original resources
- online decoders are intentionally removed in TS edition

## Incremental strategy

- start with fdb-backed search and metadata merge
- progressively move vendor logic from hand-written code to JSON DSL rules
- keep fixture comparison against PHP outputs for regression control
