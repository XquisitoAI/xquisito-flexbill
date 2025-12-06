'use client';

import { useSearchParams, useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useTable } from '../../../context/TableContext';
import { useRestaurant } from '../../../context/RestaurantContext';
import CartView from "../../../components/CartView";
import ValidationError from "../../../components/ValidationError";
import Loader from "../../../components/UI/Loader";
import { restaurantService } from "../../../services/restaurant.service";

export default function CartPage() {
  const searchParams = useSearchParams();
  const params = useParams();
  const router = useRouter();
  const { dispatch } = useTable();
  const { setRestaurantId, setBranchNumber } = useRestaurant();
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(true);

  const tableNumber = searchParams?.get('table');
  const restaurantId = params?.restaurantId as string;
  const branchNumber = params?.branchNumber as string;

  useEffect(() => {
    const validateAndSetup = async () => {
      if (!restaurantId || isNaN(parseInt(restaurantId))) {
        router.push('/');
        return;
      }

      if (!branchNumber || isNaN(parseInt(branchNumber))) {
        router.push('/');
        return;
      }

      if (!tableNumber || isNaN(parseInt(tableNumber))) {
        router.push('/');
        return;
      }

      // Establecer restaurant, sucursal y mesa en contextos
      setRestaurantId(parseInt(restaurantId));
      setBranchNumber(parseInt(branchNumber));
      dispatch({ type: 'SET_TABLE_NUMBER', payload: tableNumber });

      // Validar que el restaurante, sucursal y mesa existen
      try {
        const validation = await restaurantService.validateRestaurantBranchTable(
          parseInt(restaurantId),
          parseInt(branchNumber),
          parseInt(tableNumber)
        );

        if (!validation.valid) {
          console.error("❌ Validation failed:", validation.error);
          setValidationError(validation.error || "VALIDATION_ERROR");
        } else {
          console.log("✅ Validation successful");
          setValidationError(null);
        }
      } catch (err) {
        console.error("❌ Validation error:", err);
        setValidationError("VALIDATION_ERROR");
      } finally {
        setIsValidating(false);
      }
    };

    validateAndSetup();
  }, [tableNumber, restaurantId, branchNumber, dispatch, setRestaurantId, setBranchNumber, router]);

  // Mostrar error de validación si existe
  if (validationError) {
    return <ValidationError errorType={validationError as any} />;
  }

  // Mostrar loader mientras valida
  if (isValidating) {
    return <Loader />;
  }

  if (!tableNumber || isNaN(parseInt(tableNumber))) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Mesa Inválida</h1>
          <p className="text-gray-600">Por favor escanee el código QR</p>
        </div>
      </div>
    );
  }

  return <CartView />;
}
