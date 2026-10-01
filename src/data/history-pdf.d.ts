declare module "@/data/history-pdf.json" {
  const data: Array<{
    date: string;
    type: string;
    counterparty: string;
    amount: number;
    direction: "credit" | "debit";
    status: "completed" | "cancelled";
  }>;
  export default data;
}
