package nexus.architecture

test_deny_direct_service_calls {
  deny["Direct HTTP calls between Command Service and Query Dashboard are prohibited. Use Event Bus."] with input as {
    "type": "service_call",
    "source": "command_service",
    "target": "query_dashboard",
    "protocol": "http"
  }
}

test_allow_event_bus_communication {
  count(deny) == 0 with input as {
    "type": "service_call",
    "source": "command_service",
    "target": "event_bus",
    "protocol": "kinesis"
  }
}

test_deny_event_store_mutations {
  deny["Event Store mutations are prohibited. Only INSERT operations allowed."] with input as {
    "type": "database_operation",
    "table": "EventStore",
    "operation": "DELETE"
  }
}

test_allow_event_store_inserts {
  count(deny) == 0 with input as {
    "type": "database_operation",
    "table": "EventStore",
    "operation": "INSERT"
  }
}

test_deny_unregistered_schema {
  deny[msg] with input as {
    "type": "event_publish",
    "eventType": "UnregisteredEvent",
    "registeredSchemas": {}
  }
  contains(msg, "no registered schema")
}

test_allow_registered_schema {
  count(deny) == 0 with input as {
    "type": "event_publish",
    "eventType": "OrderPlaced",
    "registeredSchemas": {"OrderPlaced": true}
  }
}

test_deny_temporal_query_without_rate_limit {
  deny["Temporal query endpoints must have rate limit of 10 requests/minute/client"] with input as {
    "type": "api_endpoint",
    "path": "/api/queries/temporal/order-123",
    "rateLimit": 0
  }
}

test_allow_temporal_query_with_rate_limit {
  count(deny) == 0 with input as {
    "type": "api_endpoint",
    "path": "/api/queries/temporal/order-123",
    "rateLimit": 10
  }
}
