'use client';

import { useParams } from 'next/navigation';
import { useEffect } from 'react';
import MenuView from '../../components/MenuView';
import { useTable } from '../../context/TableContext';

export default function TablePage() {
  const params = useParams();
  const tableNumber = params?.tableNumber as string;
  const { dispatch } = useTable();

  useEffect(() => {
    if (tableNumber) {
      dispatch({ type: 'SET_TABLE_NUMBER', payload: tableNumber });
    }
  }, [tableNumber, dispatch]);

  if (!tableNumber) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Invalid Table</h1>
          <p className="text-gray-600">Please scan a valid QR code</p>
        </div>
      </div>
    );
  }

  return <MenuView tableNumber={tableNumber} />;
}