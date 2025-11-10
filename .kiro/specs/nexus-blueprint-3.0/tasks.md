# Implementation Plan (Revised per Architect Feedback)

This plan implements the Nexus Blueprint 3.0 with **governance-first architecture**. Based on critical architect feedback, the implementation sequence has been restructured to ensure the system is "born governed" rather than governed later.

## Key Changes from Original Plan

1. **Governance Precedence**: Schema Registry (Task 3) and Policy Engine (Task 4) are now implemented immediately after Event Store foundation
2. **Mandatory Testing**: All tests are now required - no optional tasks
3. **Synchronous Snapshot Triggers**: Snapshot evaluation moved to Command Service for 5-second latency guarantee

---

- [x] 1. Set up project structure and core interfaces
  - Create directory structure for command-service, query-dashboard, shared libraries, and infrastructure
  - Define TypeScript interfaces for Command, DomainEvent, Snapshot, and ReadModel
  - Set up monorepo configuration with shared dependencies
  - Configure TypeScript compiler options for strict type checking
  - _Requirements: 1.1, 2.1, 3.1, 4.1, 5.1_

- [x] 2. Implement Event Store foundation
  - [x] 2.1 Create DynamoDB table definitions for EventStore and Snapshots
    - Write CDK/CloudFormation for EventStore table with aggregateId partition key and version sort key
    - Create TimestampIndex GSI for temporal queries
    - Configure DynamoDB Streams for CDC
    - Set up auto-scaling policies for write capacity
    - _Requirements: 1.1, 1.2, 1.3, 1.4_
  
  - [x] 2.2 Implement EventStore client class
    - Write append() method with atomic batch writes
    - Implement getEvents() with pagination support
    - Create getEventsByTimeRange() with rate limiting (10 req/min/client)
    - Add retry logic with exponential backoff for throttling
    - _Requirements: 1.1, 1.2, 1.4, 1.5, 9.1_
  
  - [x] 2.3 Write unit tests for EventStore operations


    - Test atomic append with multiple events
    - Test pagination and filtering
    - Test rate limiting enforcement
    - Test retry behavior on throttling
    - _Requirements: 1.1, 1.2, 1.4, 1.5_






- [x] 3. Implement Schema Registry (GOVERNANCE FIRST)




  - [x] 3.1 Set up AWS Glue Schema Registry



    - Create schema registry in AWS Glue
    - Configure compatibility mode (BACKWARD)


    - Set up IAM permissions for schema operations




    - _Requirements: 2.1, 2.2, 2.3, 2.4_
  
  - [x] 3.2 Create SchemaRegistry client class


    - Implement registerSchema() with compatibility checks


    - Write validate() method for event validation
    - Create getSchema() for version retrieval
    - Add checkCompatibility() for CI/CD integration




    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_
  





  - [ ] 3.3 Implement schema validation in event publishing
    - Add pre-publish schema validation
    - Reject events with unregistered schemas
    - Log schema validation failures



    - Return detailed error messages



    - _Requirements: 2.1, 2.4, 2.5_

  





  - [ ] 3.4 Write integration tests for schema validation
    - Test schema registration
    - Test compatibility checks


    - Test validation rejection
    - Test breaking change detection
    - _Requirements: 2.1, 2.2, 2.3_

- [ ] 4. Implement Policy Engine with OPA (GOVERNANCE FIRST)
  - [x] 4.1 Create OPA policy files




    - Write decoupling enforcement policy (no direct service calls)
    - Create Event Store immutability policy (append-only)
    - Add schema registration validation policy
    - Write temporal query rate limiting policy







    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_
  


  - [x] 4.2 Set up CI/CD integration (CRITICAL)


    - Create GitHub Actions workflow for policy checks
    - Generate service dependency graph for validation
    - Configure build failure on policy violations
    - Add policy test suite




    - Block all subsequent Lambda deployments without policy validation
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_
  
  - [ ] 4.3 Implement runtime policy enforcement
    - Add policy checks in API Gateway
    - Validate operations before execution
    - Log policy violations

    - _Requirements: 12.1, 12.2, 12.3_
  

  - [ ] 4.4 Write tests for policy enforcement
    - Test decoupling policy violations
    - Test immutability policy


    - Test schema validation policy
    - Test rate limiting policy

    - _Requirements: 12.1, 12.2, 12.3, 12.4_

- [ ] 5. Implement Command Service (with governance in place)
  - [ ] 5.1 Create Command Handler base class
    - Implement command validation logic

    - Write aggregate rehydration from events
    - Create event generation and persistence flow
    - Add correlation ID tracking
    - Integrate schema validation before event append
    - _Requirements: 1.1, 1.2, 6.5, 2.1_




  
  - [ ] 5.2 Implement Snapshot loading and state reconstruction
    - Write snapshot retrieval logic
    - Implement event replay from snapshot version


    - Create aggregate state rehydration
    - _Requirements: 1.1, 11.1, 11.2_
  
  - [ ] 5.3 Implement synchronous snapshot trigger evaluation
    - Add evaluateTriggerSync() called after event append
    - Check event count and aggregate size thresholds
    - Trigger async snapshot creation within 5 seconds
    - Fire-and-forget pattern for snapshot creation
    - _Requirements: 11.2_
  
  - [ ] 5.4 Create API Gateway endpoints for commands
    - Define POST /api/commands/{commandType} endpoint
    - Implement request validation middleware
    - Add authentication and authorization
    - Return 202 Accepted with aggregate version
    - _Requirements: 1.1, 1.2_
  
  - [ ] 5.5 Write unit tests for Command Handlers
    - Test command validation
    - Test event generation
    - Test snapshot usage
    - Test schema validation integration
    - Test synchronous snapshot trigger
    - _Requirements: 1.1, 1.2, 11.2_


- [x] 6. Implement Event Bus with dual-path propagation



  - [x] 6.1 Create Kinesis Stream for core events




    - Set up Kinesis Data Stream with auto-scaling
    - Configure enhanced fan-out for consumers
    - Set retention period to 24 hours



    - Create CloudWatch metrics for throughput
    - _Requirements: 3.1, 3.2, 3.3, 6.1_


  


  - [ ] 6.2 Create SNS/SQS chain for non-critical events
    - Set up SNS topic for event fan-out


    - Create SQS queues per projection handler
    - Configure DLQ with 5 retry limit
    - Set visibility timeout to 30 seconds





    - _Requirements: 3.4, 7.2, 7.3_
  
  - [x] 6.3 Implement Event Router Lambda

    - Write DynamoDB Streams consumer
    - Implement event routing logic (core vs non-critical)
    - Add schema validation before routing (enforced by Policy Engine)


    - Publish to Kinesis or SNS based on event type
    - Emit routing metrics to CloudWatch
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 6.1_
  



  - [ ] 6.4 Write integration tests for event propagation
    - Test Kinesis publishing and consumption
    - Test SNS/SQS fan-out
    - Test routing logic
    - Measure end-to-end latency (must be < 500ms p99)


    - Test schema validation enforcement


    - _Requirements: 3.1, 3.2, 3.3_

- [ ] 7. Implement Snapshot Manager
  - [x] 7.1 Create Snapshot storage in DynamoDB







    - Define Snapshots table schema
    - Configure partition and sort keys
    - Set up TTL for old snapshots




    - _Requirements: 11.1, 11.3, 11.5_


  


  - [ ] 7.2 Implement async snapshot creation
    - Write createSnapshotAsync() method
    - Implement aggregate state rehydration
    - Write snapshot serialization

    - Store snapshot with version and metadata
    - _Requirements: 11.2, 11.3, 11.4_
  
  - [ ] 7.3 Set up EventBridge rules for time-elapsed threshold
    - Configure EventBridge rules for daily evaluation
    - Set up schedule for active aggregates

    - Handle time-elapsed threshold (24 hours)
    - _Requirements: 11.2, 11.5_
  
  - [ ] 7.4 Write tests for snapshot creation
    - Test synchronous trigger evaluation (< 5 seconds)
    - Test snapshot creation and retrieval
    - Test schema versioning
    - Test time-elapsed threshold automation

    - _Requirements: 11.2, 11.3, 11.4_

- [ ] 8. Implement Query Dashboard with OpenSearch
  - [ ] 8.1 Set up OpenSearch cluster
    - Create OpenSearch domain with 3 data nodes

    - Configure index templates with mappings
    - Set up index lifecycle policies
    - Configure access policies and encryption
    - _Requirements: 4.1, 4.2, 4.3_
  
  - [x] 8.2 Create Projection Handler base class

    - Implement event consumption from Kinesis/SQS
    - Write transform() method for read model conversion
    - Add upcasting logic for schema evolution
    - Implement OpenSearch upsert with optimistic concurrency

    - Add projection lag metrics
    - _Requirements: 4.2, 7.1, 7.5_
  
  - [ ] 8.3 Implement specific projection handlers
    - Create projection handlers for each read model
    - Write transformation logic from events to denormalized models
    - Add error handling with retry logic
    - _Requirements: 4.2, 7.1_

  
  - [ ] 8.4 Create Query API endpoints
    - Implement GET /api/queries/{resourceType} with filters
    - Add GET /api/queries/{resourceType}/search for full-text
    - Create GET /api/queries/temporal/{aggregateId} with rate limiting

    - Add pagination and caching
    - _Requirements: 4.1, 4.3, 4.4, 9.1, 9.3_
  
  - [ ] 8.5 Write integration tests for projections
    - Test event-to-read-model transformation
    - Test OpenSearch indexing

    - Test query endpoints
    - Measure projection lag (must be < 2 seconds)
    - Test upcasting logic
    - _Requirements: 4.2, 4.3, 7.5_


- [ ] 9. Implement real-time notifications
  - [ ] 9.1 Create WebSocket API Gateway
    - Set up WebSocket API with connect/disconnect routes
    - Implement connection management in DynamoDB
    - Add authentication for WebSocket connections
    - _Requirements: 5.2, 5.4_

  
  - [ ] 9.2 Implement NotificationService
    - Write notify() method to push updates to subscribers
    - Implement subscription management
    - Add throttling (100 notifications/second/client)

    - Track connection state and handle reconnections
    - _Requirements: 5.1, 5.2, 5.3, 5.5_
  
  - [ ] 9.3 Integrate notifications with Projection Handlers
    - Publish notification after successful projection update

    - Include aggregate version and event ID in notification
    - _Requirements: 5.1, 5.3_
  
  - [ ] 9.4 Write tests for real-time notifications
    - Test WebSocket connection and subscription
    - Test notification delivery

    - Test throttling behavior
    - Test reconnection logic
    - _Requirements: 5.1, 5.2, 5.5_



- [ ] 10. Implement Saga Coordinator
  - [ ] 10.1 Create Saga state management
    - Define Saga and SagaStep interfaces
    - Implement saga state persistence in DynamoDB
    - Create saga event types (Started, StepCompleted, Compensated)
    - _Requirements: 8.1, 8.2_
  
  - [x] 10.2 Implement SagaCoordinator class

    - Write executeSaga() with step-by-step execution
    - Implement executeStepWithTimeout() with configurable timeouts
    - Add compensate() for reverse-order compensation
    - Publish saga state events for audit trail
    - _Requirements: 8.1, 8.2, 8.3, 8.4_
  
  - [x] 10.3 Create Saga status API endpoint

    - Implement GET /api/sagas/{sagaId}/status
    - Return current step, completed steps, and status
    - _Requirements: 8.5_
  
  - [x] 10.4 Write tests for saga execution

    - Test successful saga completion
    - Test compensation on failure
    - Test timeout handling
    - Test audit trail completeness
    - _Requirements: 8.1, 8.2, 8.3, 8.4_


- [ ] 11. Implement error handling and resilience
  - [ ] 11.1 Create retry logic with exponential backoff
    - Implement retry decorator for DynamoDB operations
    - Add exponential backoff for projection handlers
    - Configure max retry attempts (5)
    - _Requirements: 7.2, 7.3_
  

  - [ ] 11.2 Set up Dead Letter Queues
    - Create DLQ for each SQS queue
    - Configure max receive count (5)
    - Set up DLQ monitoring alarms
    - _Requirements: 7.3_

  
  - [ ] 11.3 Implement DLQ processor
    - Write DLQProcessor class to handle failed messages
    - Implement determineAction() for retry/skip/manual decisions
    - Add message archiving for skipped messages

    - Create CloudWatch dashboard for DLQ metrics
    - _Requirements: 7.3_
  
  - [ ] 11.4 Add comprehensive error logging
    - Implement structured logging with correlation IDs

    - Add error context (event, retry count, failure reason)
    - Set up log aggregation in CloudWatch
    - _Requirements: 6.1, 6.2, 6.3, 6.4_
  
  - [ ] 11.5 Write chaos tests for resilience (MANDATORY)
    - Test poison pill event handling
    - Test OpenSearch unavailability
    - Test DynamoDB throttling

    - Test network partition scenarios
    - Verify DLQ behavior under all failure modes
    - _Requirements: 7.1, 7.2, 7.3_

- [ ] 12. Implement observability and monitoring
  - [x] 12.1 Create CloudWatch metrics

    - Emit command processing latency metrics
    - Track event publication rate and throughput
    - Record projection lag in seconds
    - Monitor cache hit rates
    - Track DLQ message counts
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_
  

  - [ ] 12.2 Set up distributed tracing
    - Implement X-Ray integration in all Lambda functions
    - Propagate correlation IDs through event metadata
    - Create trace segments for key operations
    - _Requirements: 6.5_

  
  - [ ] 12.3 Create CloudWatch alarms
    - Set up alarm for high projection lag (> 5 seconds)
    - Create alarm for DLQ depth > 0
    - Add alarm for command service errors (> 10/min)
    - Configure alarm for Event Store throttling
    - _Requirements: 6.1, 6.2, 6.3, 6.4_
  

  - [ ] 12.4 Build CloudWatch dashboards
    - Create dashboard for command service metrics
    - Add dashboard for event propagation metrics
    - Build dashboard for query performance
    - Create operational health dashboard
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_


- [ ] 13. Implement schema evolution and upcasting
  - [ ] 13.1 Create EventUpcaster class
    - Define transformer interface for version migrations
    - Implement transformation chain logic
    - Add version detection and routing

    - _Requirements: 2.3, 2.4_
  
  - [ ] 13.2 Implement version-specific transformers
    - Create example transformer (e.g., V1ToV2Transformer)
    - Write transformation logic for field changes
    - Update schema version in metadata

    - _Requirements: 2.3, 2.4_
  
  - [ ] 13.3 Integrate upcasting in Projection Handlers
    - Apply upcasting before transformation
    - Handle missing transformers gracefully
    - Log upcasting operations
    - _Requirements: 2.3, 2.4_
  
  - [ ] 13.4 Write tests for schema evolution (MANDATORY)
    - Test upcasting from v1 to v2
    - Test compatibility validation

    - Test rejection of breaking changes
    - Test historical event replay with upcasting
    - _Requirements: 2.2, 2.3, 2.4_


- [x] 14. Implement temporal queries

  - [ ] 14.1 Create temporal query endpoint
    - Implement GET /api/queries/temporal/{aggregateId}
    - Add asOf query parameter validation
    - Enforce 90-day time range limit
    - Apply rate limiting (10 req/min/client) via Policy Engine
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_
  
  - [ ] 14.2 Implement temporal query handler
    - Read events from Event Store up to timestamp

    - Rehydrate aggregate state at historical point
    - Apply timeout (30 seconds)
    - Limit events scanned (10000 max)
    - Return partial results with continuation token if needed
    - _Requirements: 9.3, 9.4, 9.5_

  
  - [ ] 14.3 Add authentication and authorization
    - Implement role-based access control
    - Require specific permissions for temporal queries
    - Log all temporal query requests with client identity
    - _Requirements: 9.2, 9.4_

  
  - [ ] 14.4 Write tests for temporal queries (MANDATORY)
    - Test historical state reconstruction
    - Test rate limiting enforcement
    - Test time range validation
    - Test timeout behavior
    - Test resource limit enforcement
    - _Requirements: 9.1, 9.2, 9.3, 9.5_


- [ ] 15. Create infrastructure as code
  - [ ] 15.1 Write CDK/CloudFormation for core infrastructure
    - Define DynamoDB tables (EventStore, Snapshots)
    - Create Kinesis streams and SNS/SQS resources
    - Set up OpenSearch domain

    - Configure API Gateway
    - _Requirements: 1.1, 1.2, 3.1, 3.4, 4.1_
  
  - [ ] 15.2 Define Lambda functions and permissions
    - Create Lambda function definitions for all handlers
    - Configure IAM roles and policies
    - Set up environment variables

    - Configure VPC and security groups
    - _Requirements: All_
  
  - [ ] 15.3 Set up monitoring and alerting infrastructure
    - Define CloudWatch alarms in IaC
    - Create SNS topics for notifications

    - Configure log groups and retention
    - Set up X-Ray tracing
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_
  
  - [ ] 15.4 Create deployment pipeline with policy validation
    - Write CI/CD pipeline for automated deployment
    - Add policy validation stage (BLOCKS deployment on violations)



    - Configure blue-green deployment
    - Set up rollback mechanisms
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_


- [x] 16. Create example domain implementation


  - [ ] 16.1 Define example aggregate (e.g., Order)
    - Create Order aggregate class
    - Define order-related commands (PlaceOrder, CancelOrder)

    - Define order-related events (OrderPlaced, OrderCancelled)
    - Implement business logic and validation
    - _Requirements: 1.1, 1.2_
  
  - [ ] 16.2 Implement Order command handlers
    - Create PlaceOrderHandler


    - Create CancelOrderHandler
    - Add validation logic



    - Wire handlers to API endpoints
    - _Requirements: 1.1, 1.2_
  
  - [ ] 16.3 Create Order projection handlers
    - Implement OrderListProjection for list views
    - Create OrderSearchProjection for full-text search
    - Add transformation logic
    - _Requirements: 4.2, 7.1_
  
  - [ ] 16.4 Register Order event schemas
    - Define JSON schemas for OrderPlaced and OrderCancelled
    - Register schemas in Schema Registry
    - Set compatibility mode to BACKWARD
    - Validate via Policy Engine
    - _Requirements: 2.1, 2.2_
  
  - [ ] 16.5 Write end-to-end tests for Order workflow (MANDATORY)
    - Test order placement flow
    - Test order cancellation flow
    - Test query after command
    - Test real-time notifications
    - Test schema validation enforcement
    - _Requirements: 1.1, 1.2, 4.2, 5.1_

- [ ] 17. Create documentation and examples
  - [ ] 17.1 Write API documentation
    - Document all command endpoints with examples
    - Document all query endpoints with examples
    - Add WebSocket protocol documentation
    - Include error response formats
    - _Requirements: All_
  
  - [ ] 17.2 Create developer guide
    - Write guide for adding new aggregates
    - Document how to create command handlers
    - Explain projection handler implementation
    - Add schema evolution guide
    - Document policy compliance requirements
    - _Requirements: All_
  
  - [ ] 17.3 Write operational runbook
    - Document deployment procedures
    - Add troubleshooting guide
    - Include DLQ processing procedures
    - Document monitoring and alerting
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 7.3_
  
  - [ ] 17.4 Create architecture decision records
    - Document governance-first approach
    - Explain synchronous snapshot trigger decision
    - Document dual-path event propagation decision
    - Explain OpenSearch consolidation rationale
    - Record policy engine choice
    - _Requirements: All_

- [ ] 18. Performance optimization and tuning
  - [ ] 18.1 Optimize DynamoDB configuration
    - Tune read/write capacity units
    - Configure auto-scaling policies
    - Optimize GSI projections
    - _Requirements: 1.1, 1.2, 1.4_
  
  - [ ] 18.2 Optimize OpenSearch performance
    - Tune index settings (shards, replicas)
    - Configure refresh interval
    - Optimize query patterns
    - Add caching for frequent queries
    - _Requirements: 4.3, 4.5_
  
  - [ ] 18.3 Optimize Lambda functions
    - Configure memory and timeout settings
    - Implement connection pooling
    - Add provisioned concurrency for critical functions
    - Optimize cold start performance
    - _Requirements: 3.1, 3.2, 3.3, 6.1_
  
  - [ ] 18.4 Run performance tests and validate SLAs (MANDATORY)
    - Test command processing latency (< 200ms p99)
    - Measure projection lag (< 2 seconds)
    - Validate event propagation latency (< 500ms p99)
    - Test throughput (10000+ events/second)
    - Validate snapshot trigger latency (< 5 seconds)
    - _Requirements: 1.4, 3.1, 4.2, 6.1, 11.2_

---

## Critical Implementation Notes

### Governance-First Mandate

**Tasks 3 (Schema Registry) and 4 (Policy Engine) MUST be completed before any service logic (Tasks 5+).** This ensures:
- All events are validated against registered schemas before publication
- Architectural constraints (decoupling, immutability) are enforced in CI/CD
- No anti-patterns can be introduced during development

### No Optional Tests

All testing tasks are **mandatory**. The resilience and auditability of the Nexus Blueprint 3.0 depends on:
- Integration tests validating cross-service behavior
- Chaos tests proving DLQ and retry logic
- Schema evolution tests ensuring historical events remain usable
- Performance tests validating SLA compliance

### Synchronous Snapshot Triggers

Per Requirement 11.2, snapshots must be created within **5 seconds** of threshold detection. The implementation uses:
- **Synchronous evaluation** in Command Service after event append
- **Asynchronous creation** (fire-and-forget) to avoid blocking command processing
- **EventBridge backup** for time-elapsed threshold only

### Sequence Summary

1. **Foundation** (Tasks 1-2): Project structure and Event Store
2. **Governance** (Tasks 3-4): Schema Registry and Policy Engine with CI/CD integration
3. **Services** (Tasks 5-10): Command Service, Event Bus, Snapshots, Query Dashboard, Notifications, Sagas
4. **Resilience** (Tasks 11-12): Error handling, DLQ, monitoring
5. **Advanced** (Tasks 13-14): Schema evolution, temporal queries
6. **Deployment** (Tasks 15-18): Infrastructure, examples, documentation, optimization

This sequence ensures the system is "born governed" and maintains architectural integrity throughout development.
