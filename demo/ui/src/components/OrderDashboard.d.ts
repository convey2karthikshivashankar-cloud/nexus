import { Order } from '../App';
interface Props {
    orders: Order[];
    onPlaceOrder: (data: any) => Promise<any>;
    onCancelOrder: (orderId: string) => Promise<any>;
    onRefresh: () => void;
}
export default function OrderDashboard({ orders, onPlaceOrder, onCancelOrder, onRefresh }: Props): import("react").JSX.Element;
export {};
