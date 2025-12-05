# Nexus Blueprint 3.0 - Demo UI

A stunning, interactive demo UI showcasing the Nexus Blueprint event-sourced architecture.

## Features

- 📊 **Order Dashboard** - Place and manage orders in real-time
- 🌊 **Event Timeline** - Visualize the complete event stream
- ⚡ **Performance Metrics** - Real-time system performance monitoring
- 🚀 **Load Tester** - Configurable burst testing with live metrics
- 🏗️ **Architecture Diagram** - Interactive system architecture visualization

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Build for Production

```bash
npm run build
```

This creates an optimized production build in the `dist/` folder.

### 3. Deploy to S3

The build output needs to be uploaded to the S3 bucket created by CDK:

```bash
# Using AWS CLI
aws s3 sync dist/ s3://nexus-demo-ui-557810226161/ --delete

# Or using PowerShell
aws s3 sync dist/ s3://nexus-demo-ui-557810226161/ --delete
```

### 4. Access the Demo

Open your browser to:
```
http://nexus-demo-ui-557810226161.s3-website.us-east-2.amazonaws.com
```

## Development

Run the development server:

```bash
npm run dev
```

Then open http://localhost:5173

## Features Demonstrated

### 1. Event Sourcing
- Complete audit trail of all state changes
- Immutable event store
- Time-travel capabilities

### 2. CQRS Pattern
- Separate write (commands) and read (queries) models
- Optimized for their specific use cases
- Independent scaling

### 3. Real-Time Updates
- Auto-refresh every 3 seconds
- Live metrics and statistics
- Instant feedback on operations

### 4. Load Testing
- Configurable number of concurrent requests
- Real-time progress tracking
- Detailed performance metrics
- Latency distribution visualization

### 5. Performance Monitoring
- Average latency tracking
- Success rate monitoring
- Throughput metrics
- System health indicators

## Architecture

```
Browser (React)
    ↓
API Gateway
    ↓
┌───────────┬───────────┐
│  Command  │   Query   │
│  Lambda   │   Lambda  │
└─────┬─────┴─────▲─────┘
      │           │
      ▼           │
┌─────────────────┴─────┐
│   DynamoDB Tables     │
│  - Event Store        │
│  - Read Model         │
└───────────────────────┘
```

## Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Lucide React** - Icons
- **Tailwind-inspired** - Styling (inline)

## API Configuration

The UI connects to:
```
https://6lo5q41e31.execute-api.us-east-2.amazonaws.com/prod
```

Endpoints:
- `POST /commands` - Place orders
- `GET /queries` - Query orders
- `GET /events` - View event timeline

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

## Performance

- Initial load: < 1s
- Time to interactive: < 2s
- Bundle size: ~200KB (gzipped)

## License

MIT
