interface Props {
    onTest: (data: any) => Promise<any>;
    onComplete: () => void;
}
export default function LoadTester({ onTest, onComplete }: Props): import("react").JSX.Element;
export {};
