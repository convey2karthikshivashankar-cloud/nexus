import { Order, Event } from '../App';
interface Props {
    onPlaceOrder: (data: any) => Promise<any>;
    onCancelOrder: (orderId: string) => Promise<any>;
    orders: Order[];
    events: Event[];
    onRefresh: () => void;
}
export default function CQRSDemo({ onPlaceOrder, onCancelOrder, orders, events, onRefresh }: Props): import("react").JSX.Element;
export {};
