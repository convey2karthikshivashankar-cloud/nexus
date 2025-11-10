package nexus.architecture

# Rule: Services must communicate via Event Bus only
deny[msg] {
  input.type == "service_call"
  input.source == "command_service"
  input.target == "query_dashboard"
  input.protocol == "http"
  
  msg := "Direct HTTP calls between Command Service and Query Dashboard are prohibited. Use Event Bus."
}

deny[msg] {
  input.type == "service_call"
  input.source == "query_dashboard"
  input.target == "command_service"
  input.protocol == "http"
  
  msg := "Direct HTTP calls between Query Dashboard and Command Service are prohibited. Use Event Bus."
}

# Rule: Event Store is append-only
deny[msg] {
  input.type == "database_operation"
  input.table == "EventStore"
  input.operation in ["UPDATE", "DELETE"]
  
  msg := "Event Store mutations are prohibited. Only INSERT operations allowed."
}

# Rule: All events must have registered schemas
deny[msg] {
  input.type == "event_publish"
  not schema_exists(input.eventType)
  
  msg := sprintf("Event type '%s' has no registered schema in Schema Registry", [input.eventType])
}

# Rule: Temporal queries must be rate-limited
deny[msg] {
  input.type == "api_endpoint"
  contains(input.path, "/api/queries/temporal/")
  not has_rate_limit(input, 10)
  
  msg := "Temporal query endpoints must have rate limit of 10 requests/minute/client"
}

# Rule: Snapshots table is append-only (no updates to existing snapshots)
deny[msg] {
  input.type == "database_operation"
  input.table == "Snapshots"
  input.operation == "UPDATE"
  
  msg := "Snapshot mutations are prohibited. Create new snapshot versions instead."
}

# Helper functions
schema_exists(eventType) {
  input.registeredSchemas[eventType]
}

has_rate_limit(endpoint, limit) {
  endpoint.rateLimit >= limit
}
