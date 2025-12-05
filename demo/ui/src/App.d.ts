export interface Order {
    orderId: string;
    customerId: string;
    status: string;
    totalAmount: number;
    items: any[];
    createdAt: string;
    updatedAt: string;
}
export interface Event {
    eventId: string;
    eventType: string;
    aggregateId: string;
    version: number;
    timestamp: string;
    payload: any;
    metadata: any;
}
export interface Metrics {
    totalOrders: number;
    totalEvents: number;
    avgLatency: number;
    successRate: number;
    totalValue: number;
    cancelledOrders: number;
}
declare function App(): import("react").JSX.Element;
export default App;
