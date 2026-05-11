import { useState } from "react";

export function useRfqForm() {
  const [customer, setCustomer] = useState("");
  const [rfqNum, setRfqNum] = useState("");
  const [requestText, setRequestText] = useState("");
  const [notes, setNotes] = useState("");
  const [extraCustomerInfo, setExtraCustomerInfo] = useState("");
  const [manualPurchaseCount, setManualPurchaseCount] = useState("");
  const [manualPurchaseAmount, setManualPurchaseAmount] = useState("");

  return {
    customer, setCustomer,
    rfqNum, setRfqNum,
    requestText, setRequestText,
    notes, setNotes,
    extraCustomerInfo, setExtraCustomerInfo,
    manualPurchaseCount, setManualPurchaseCount,
    manualPurchaseAmount, setManualPurchaseAmount,
  };
}
