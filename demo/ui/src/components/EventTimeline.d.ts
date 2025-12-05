import { Event } from '../App';
interface Props {
    events: Event[];
    onRefresh: () => void;
}
export default function EventTimeline({ events, onRefresh }: Props): import("react").JSX.Element;
export {};
