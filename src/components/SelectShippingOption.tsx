import React, { useEffect, useState, useMemo, useCallback } from "react";
import { Select, Form } from "antd";
import { useAppSelector } from "../store";
import Spinner from "./Spinner";
import { updateCurrentOption } from "../store/features/shippingSlice";
import { useAppDispatch } from "../store";
import { fetchShippingOption } from "../store/features/shippingSlice";

interface ShippingOption {
  rate: number;
  shipping_method: string;
  calculated_total: {
    order_subtotal: number;
    order_discount: number;
    order_shipping_rate: number;
    order_sales_tax: number;
    order_grand_total: number;
    order_credits_used: number;
    order_po?: string;
  };
}

interface OrderItem {
  product_qty: number;
  product_sku: string;
  product_order_po: string;
  product_image: {
    product_url_file: string;
    product_url_thumbnail: string;
  };
}

const SelectShippingOption: React.FC<{
  poNumber: string;
  orderItems: any;
  localOrder: any;
  productchange: any;
  clicking: boolean;

  onShippingOptionChange: (poNumber: string, total: number) => void;
}> = ({ poNumber, orderItems, onShippingOptionChange, localOrder, productchange, clicking }) => {
  console.log("popo", poNumber);
  console.log("localOrder", localOrder);
  const dispatch = useAppDispatch();


  const shipping_option = useAppSelector(
    (state) => state.Shipping.shippingOptions || []
  );
console.log("shipping_option", shipping_option);
  console.log("shipping_option", shipping_option);

  const currentOption = useAppSelector((state) => state.Shipping.currentOption);
  console.log("currentOption", currentOption);

  const shipping_details = useMemo(
    () => shipping_option?.find((option) => option.order_po == poNumber),
    [shipping_option, poNumber]
  );
console.log("shipping_details", shipping_details);
  const [selectedOption, setSelectedOption] = useState<any>(null)
  console.log("selectedOption", selectedOption);
  // Set initial preferred option if available
  useEffect(() => {
    // Only update if this is for the current PO number or if no selection exists
    if (!selectedOption ) {
      if (shipping_details?.preferred_option) {
        setSelectedOption(shipping_details.preferred_option);
        // Update current option in store if it's the preferred option
        dispatch(updateCurrentOption({
          ...shipping_details.preferred_option,
          order_po: poNumber
        }));
      }
    } else if (currentOption?.order_po === poNumber) {
      // Only update if the current option is for this order
      setSelectedOption(
        shipping_details?.options.find((opt: ShippingOption) => opt?.rate === currentOption?.rate)
      );

    }
  }, [shipping_details, poNumber]);



  const handleOptionChange = useCallback(
    (value: string) => {
      const option = shipping_details?.options?.find(
        (opt: ShippingOption) => `${opt.rate}-$${opt.shipping_method}` === value
      );
      if (option) {
        setSelectedOption(option);
        // Add the order_po to the option when dispatching
        dispatch(updateCurrentOption({
          ...option,
          order_po: poNumber
        }));
        // Notify the parent about the updated shipping price
        onShippingOptionChange(
          poNumber,
          option?.calculated_total
        );
      }
    },
    [shipping_details, poNumber, onShippingOptionChange, dispatch]
  );
console.log("prod", productchange);

useEffect(() => {
  if (localOrder?.order_items?.length > 0 || productchange) {
    const orderPostDataList = {
      order_po: localOrder.order_po,
      order_items: localOrder.order_items.map((item: OrderItem) => ({
        product_order_po: localOrder.order_po,
        product_qty: item.product_qty,
        product_sku: item.product_sku,
        product_image: {
          product_url_file: "https://inventory.finerworks.com/81de5dba-0300-4988-a1cb-df97dfa4e372/s173618563107067060__shutterstock_2554522269/thumbnail/200x200_s173618563107067060__shutterstock_2554522269.jpg",
          product_url_thumbnail: "https://inventory.finerworks.com/81de5dba-0300-4988-a1cb-df97dfa4e372/s173618563107067060__shutterstock_2554522269/thumbnail/200x200_s173618563107067060__shutterstock_2554522269.jpg",
        }
      })),
    };

    console.log("Product changed, refetching shipping options");
    dispatch(fetchShippingOption([orderPostDataList]));
  }
}, [localOrder, productchange, dispatch]);

useEffect(() => {
  if (productchange) {
    if (shipping_details?.preferred_option) {
      setSelectedOption(shipping_details.preferred_option);
      // Update current option in store with order_po
      dispatch(updateCurrentOption({
        ...shipping_details.preferred_option,
        order_po: poNumber
      }));
    } else if (currentOption?.order_po === poNumber) {
      // Only update if the current option is for this order
      setSelectedOption(
        shipping_details?.options.find(
          (opt: ShippingOption) => opt.rate === currentOption.rate
        )
      );
    }
  }
}, [shipping_details, currentOption, productchange, poNumber, dispatch]);
console.log("shipping_details", shipping_details);

  if (!shipping_details || clicking) {
    return (
      <div className="flex-col items-center text-center p-12">
        {" "}
        <Spinner message={"Retrieving shipping options"} />{" "}
      </div>
    );
  }

  const subTotal = selectedOption?.calculated_total?.order_subtotal || 0;
  const discount = selectedOption?.calculated_total?.order_discount || 0;
  const shipping = selectedOption?.calculated_total?.order_shipping_rate || 0;
  const salesTax = selectedOption?.calculated_total?.order_sales_tax || 0;
  const grandTotal = selectedOption?.calculated_total?.order_grand_total || 0;
  const accountCredit = selectedOption?.calculated_total?.order_credits_used || 0;

  return (
    <>
      <Form
        labelCol={{ span: 4 }}
        wrapperCol={{ span: 14 }}
        layout="horizontal"
        className="w-full country_code_importlist_form"
      >
        <Form.Item name="shipping_option">
          <div className="relative w-full text-gray-500">
            <Select
              className="w-full"
              showSearch={false} 
              placeholder="Select Shipping Method"
              optionFilterProp="children"
              onChange={handleOptionChange}
              dropdownStyle={{ touchAction: 'manipulation' }}
              getPopupContainer={(trigger) => trigger.parentNode}
              listHeight={250}
              dropdownMatchSelectWidth={false}
              value={
                selectedOption
                  ? `${selectedOption.rate}-$${selectedOption.shipping_method}`
                  : undefined
              }
              options={shipping_details?.options?.map((option: ShippingOption) => ({
                value: `${option.rate}-$${option.shipping_method}`,
                label: `${option.shipping_method} - $${option.rate}`,
              }))}
            />
            <label htmlFor="shipping_method" className="fw-label">
              Shipping Method
            </label>
          </div>
        </Form.Item>
      </Form>

      <div className="w-full text-sm pt-5"></div>
      <div className="w-full text-sm">Sub Total: ${subTotal.toFixed(2)}</div>
      <div className="w-full text-sm">Discount: (${discount.toFixed(2)})</div>
      <div className="w-full text-sm">Shipping: ${shipping.toFixed(2)}</div>
      <div className="w-full text-sm">Sales Tax: ${salesTax.toFixed(2)}</div>
      <div className="w-full text-sm">GrandTotal: ${grandTotal}</div>
      {/* <div className="w-full text-sm text-amber-500">Account Credit: ${accountCredit}</div> */}
      

    </>
  );
};

export default SelectShippingOption;



