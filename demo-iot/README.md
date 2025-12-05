# Nexus IoT Demo - CQRS Event Sourcing for Sensor Data

This demo showcases the Nexus Blueprint CQRS skeleton applied to an **IoT Sensor Monitoring** domain.

## 🌡️ Domain Overview

This application demonstrates event-sourced CQRS for IoT sensor data management:

### Commands (Write Side)
- **RegisterSensor** - Register a new IoT sensor (temperature, humidity, etc.)
- **RecordReading** - Record a sensor reading value
- **TriggerAlert** - Trigger an alert when thresholds are breached
- **AcknowledgeAlert** - Acknowledge and resolve an alert

### Events (Immutable Log)
- `SensorRegistered` - A new sensor was added to the system
- `ReadingRecorded` - A sensor reading was captured
- `AlertTriggered` - A threshold breach was detected
- `AlertAcknowledged` - An alert was acknowledged by an operator

### Queries (Read Side)
- **GetSensors** - List all registered sensors with current status
- **GetReadings** - Get recent readings (optionally filtered by sensor)
- **GetAlerts** - Get active and historical alerts
- **GetEvents** - View the complete event stream

## 🏗️ Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   IoT Sensors   │────▶│  Command Handler │────▶│   Event Store   │
│  (Data Source)  │     │   (Lambda)       │     │   (DynamoDB)    │
└─────────────────┘     └──────────────────┘     └────────┬────────┘
                                                          │
                                                          ▼
                                                 ┌─────────────────┐
                                                 │ Stream Processor│
                                                 │   (Lambda)      │
                                                 └────────┬────────┘
                                                          │
                        ┌─────────────────────────────────┼─────────────────────────────────┐
                        ▼                                 ▼                                 ▼
               ┌─────────────────┐               ┌─────────────────┐               ┌─────────────────┐
               │  Sensors Table  │               │ Readings Table  │               │  Alerts Table   │
               │  (Read Model)   │               │  (Read Model)   │               │  (Read Model)   │
               └────────┬────────┘               └────────┬────────┘               └────────┬────────┘
                        │                                 │                                 │
                        └─────────────────────────────────┼─────────────────────────────────┘
                                                          │
                                                          ▼
                                                 ┌─────────────────┐
                                                 │  Query Handler  │
                                                 │   (Lambda)      │
                                                 └────────┬────────┘
                                                          │
                                                          ▼
                                                 ┌─────────────────┐
                                                 │   Dashboard UI  │
                                                 │    (React)      │
                                                 └─────────────────┘
```

## 🚀 Deployment

### Prerequisites
- AWS CLI configured with appropriate credentials
- Node.js 18+
- AWS CDK CLI (`npm install -g aws-cdk`)

### Deploy Backend

```bash
cd demo-iot
npm install
npm run build
cdk deploy
```

### Deploy UI

```bash
cd demo-iot/ui
npm install
npm run build
# Upload dist/ to S3 bucket (created by CDK)
```

## 📊 UI Features

The demo UI includes:

1. **CQRS Demo Tab** - Interactive demonstration of command/query separation
2. **Sensors Tab** - Register sensors and record readings
3. **Event Stream Tab** - View immutable event log with filtering
4. **Metrics Tab** - Real-time performance analytics
5. **Load Test Tab** - Stress test sensor reading ingestion
6. **Architecture Tab** - Visual system architecture diagram

## 🔧 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /commands | Execute commands (RegisterSensor, RecordReading, etc.) |
| GET | /queries | Get dashboard summary |
| GET | /sensors | List all sensors |
| GET | /sensors/{id} | Get sensor details |
| GET | /readings | Get recent readings |
| GET | /alerts | Get alerts |
| GET | /events | Get event stream |

## 🎯 Key CQRS Benefits for IoT

1. **High-Volume Ingestion** - Optimized write path handles millions of readings
2. **Time-Series Queries** - Read models optimized for historical analysis
3. **Complete Audit Trail** - Every reading preserved for compliance
4. **Real-time Alerts** - Stream processing enables instant threshold detection
5. **Independent Scaling** - Scale read and write workloads separately

## 📁 Project Structure

```
demo-iot/
├── bin/                    # CDK app entry point
├── infrastructure/         # CDK stack definition
├── lambda/
│   ├── command-handler/    # Write side Lambda
│   ├── query-handler/      # Read side Lambda
│   └── event-processor/    # Stream processor Lambda
├── ui/                     # React dashboard
│   └── src/
│       ├── components/     # UI components
│       └── App.tsx         # Main application
└── README.md
```

## 🔗 Related

- [Main Demo (E-commerce Orders)](../demo/) - Order management domain
- [CQRS Skeleton](../packages/shared/) - Generic CQRS foundation
