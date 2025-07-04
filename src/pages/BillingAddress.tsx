import React, { useState, useEffect } from "react";
import { Checkbox, Form, Input, InputNumber, Select } from "antd";

import { getStates } from "country-state-picker";
import type { SelectProps } from "antd";
import { countryType } from "../types/ICountry";
import type { CheckboxProps } from "antd";
import { useAppDispatch, useAppSelector } from "../store";
import { updateBilling } from "../store/features/companySlice";
import convertUsStateAbbrAndName from "../services/state";
import PaymentMethods from "../components/PaymentMethods";

const countryList = require("../json/country.json");

const { Option } = Select;
type SizeType = Parameters<typeof Form>[0]["size"];

// Define interface for state data to fix type errors
interface StateOption {
  label: string;
  value: string;
}

const BillingAddress: React.FC = () => {
  const [countryCode, setCountryCode] = useState("us");
  const [copyCompanyAddress, setCopyCompanyAddress] = useState(false);
  const [isInitialDataLoaded, setIsInitialDataLoaded] = useState(false);
  const billingInfo = useAppSelector(
    (state) => state.company?.company_info?.data?.billing_info
  );
  console.log(billingInfo);
  const [companyAddress, setCompanyAddress] = useState<any>({
    last_name: "",
    first_name: "",
    company_name: "",
    address_1: "",
    address_2: "",
    city: "",
    zip_postal_code: "",
    phone: "",
  });
  const [componentSize, setComponentSize] = useState<SizeType | "default">(
    "default"
  );
  const [stateData, setStateData] = useState<StateOption[]>([]);
  const [form1] = Form.useForm();
  const [stateCode, setStateCode] = useState<string>("");
  const [stateCodeShort, setStateCodeShort] = useState<string | null>("");
  const dispatch = useAppDispatch();
  console.log(stateCode, stateCodeShort);
  const myBillingInfo = useAppSelector(
    (state) => state.company?.myBillingInfoFilled
  );
  console.log("myBillingInfo", myBillingInfo);
  const businessInfo = useAppSelector(
    (state) => state.company?.company_info?.data?.business_info
  );
  console.log("bsbs", businessInfo);

  const checkboxClick: CheckboxProps["onChange"] = (e) => {
    e.preventDefault();
    console.log("value......", e.target.checked, businessInfo);
    if (e.target.checked) {
      // let billingInfo = businessInfo
      // form1.resetFields();
      form1.setFieldsValue(
        businessInfo
        // {'first_name':"werwer"}
      );
      setCopyCompanyAddress(true);
    } else {
      !companyAddress?.last_name && setCompanyAddress(businessInfo);
      setCopyCompanyAddress(false);
      // form1.resetFields();
    }
  };

  const onChangeState = (value: string) => {
    // Handle empty selection or undefined values
    let state_code: string = value ? value.toLowerCase() : "";
    console.log(`onChangeState ${state_code}`, countryCode);
    
    // If input is a 2-letter code, convert it to full state name for display
    if (countryCode === "us" && state_code.length === 2) {
      const fullStateName = convertUsStateAbbrAndName(state_code.toUpperCase());
      if (fullStateName) {
        state_code = fullStateName.toLowerCase();
      }
    }
    
    setStateCode(state_code);
    if (countryCode === "us") {
      // When saving, convert full state name back to abbreviation
      const stateAbbr = state_code.length > 2 ? convertUsStateAbbrAndName(state_code) : state_code.toUpperCase();
      setStateCodeShort(stateAbbr || "");
    } else {
      setStateCodeShort(state_code);
    }
  };

  const onChange = (value: string) => {
    let country_code = value?.toLowerCase();
    console.log(`selected ${country_code}`);
    setCountryCode(country_code);
    setStates(country_code?.toLowerCase());
    // Clear state values when country changes
    setStateCode("");
    setStateCodeShort("");
    // Reset the state_code field and trigger validation
    form1.setFieldsValue({ state_code: undefined });
    form1.validateFields(['state_code']).catch(() => {
      // Validation error is expected here, we just want to trigger the validation
    });
    updateBilling({ billing_info: { country_code: country_code } });
  };
  console.log("countryCode", countryCode);

  const setStates = (value: string = "us") => {
    let states = getStates(value);
    let data: StateOption[] = (states || []).map((d: string) => ({
      label: d,
      // Ensure value is always lowercase for consistent comparison
      value: d.toLowerCase(),
    }));

    setStateData(data);
  };
  //update state_code on commponent mount

  const onValid = () => {
    const values = form1.getFieldsValue();
    console.log("vovvo", values);
    const normalizedStateCode =
      countryCode === "us" ? stateCodeShort : stateCode;
    console.log("normalizedStateCode", normalizedStateCode);

    let payload = {
      ...values,
      country_code: countryCode,
      state_code: normalizedStateCode || values?.state_code,
    };
    if (countryCode !== "us") {
      payload.state_code = "";
      payload.province = stateCode || normalizedStateCode;
    }
    form1
      .validateFields()
      .then(() => {
        dispatch(updateBilling({ billing_info: payload }));
      })
      .catch((errorInfo) => {
        const errors = errorInfo.errorFields.reduce((acc: any, field: any) => {
          acc[field.name[0]] = field.errors;
          return acc;
        }, {});
        dispatch(updateBilling({ billing_info: payload, validFields: errors }));
      });
  };

  const onSearch = (value: string) => {
    console.log("search:", value);
  };

  // Filter `option.label` match the user type `input`
  const filterOption = (
    input: string,
    option?: { label: string; value: string }
  ) => (option?.label ?? "").toLowerCase().includes(input.toLowerCase());

  useEffect(() => {
    // Initialize country
    onChange(countryCode);
  }, []);

  useEffect(() => {
    if (billingInfo?.country_code && !companyAddress.company_name) {
      console.log("effect countryCode", billingInfo?.country_code);
      // Update country without triggering cascading effects
      setCountryCode(billingInfo?.country_code);
      setStates(billingInfo?.country_code);
      
      // Set form values directly
      const formData = {
        ...billingInfo,
      };
      
      setCompanyAddress(billingInfo);
      form1.setFieldsValue(formData);
      dispatch(updateBilling({ billing_info: billingInfo, validFields: {} }));
      
      // Mark initial data as loaded
      setIsInitialDataLoaded(true);
    }
  }, [billingInfo, form1]);

  const handleInputChange = (e: any, field: any) => {
    // Check if e is a direct value (from InputNumber) or an event object
    const value = e?.target ? e.target.value : e;
    console.log("valval", value);

    // Update the local state with the new value
    setCompanyAddress((prev: any) => {
      const updated = { ...prev, [field]: value };
      console.log("companyAddress updated", updated);

      // Update the form field value
      form1.setFieldsValue({ [field]: value });

      // Validate and dispatch after state update
      form1
        .validateFields()
        .then(() => {
          dispatch(updateBilling({ billing_info: updated }));
        })
        .catch((errorInfo) => {
          const errors = errorInfo.errorFields.reduce(
            (acc: any, field: any) => {
              acc[field.name[0]] = field.errors;
              return acc;
            },
            {}
          );
          dispatch(
            updateBilling({ billing_info: updated, validFields: errors })
          );
        });

      return updated;
    });
  };

  console.log("stateCode", stateCode);

  const displayTurtles = (
    <Form
      form={form1}
      labelCol={{ span: 4 }}
      wrapperCol={{ span: 14 }}
      layout="horizontal"
      className="w-full flex flex-col items-center"
    >
      <Form.Item name="country_code" className="w-full sm:ml-[200px]">
        <div className="relative">
          <Select
            showSearch
            defaultValue={"US"}
            value={countryCode.toUpperCase()}
            placeholder="Select a country"
            optionFilterProp="children"
            onChange={onChange}
            onSearch={onSearch}
            filterOption={filterOption}
            options={countryList}
            onBlur={onValid}
          ></Select>
          <label htmlFor="floating_outlined" className="fw-label">
            Country
          </label>
        </div>
      </Form.Item>
      <Form.Item
        rules={[{ required: false, message: "Please enter your Company Name!" }]}
        name="company_name"
        className="w-full sm:ml-[200px]"
      >
        <div className="relative">
          <Input
            onBlur={onValid}
            onChange={(e) => handleInputChange(e, "company_name")}
            value={
              copyCompanyAddress
                ? businessInfo?.company_name
                : companyAddress?.company_name
            }
            className="fw-input"
          />
          <label htmlFor="floating_outlined" className="fw-label">
            My Company Name
          </label>
        </div>
      </Form.Item>
      <Form.Item
        rules={[
          { required: true, message: "Please enter your First Name!" },
          {
            pattern: new RegExp(/^[a-zA-Z ]+$/i),
            message: "Please enter only alphabet characters!",
          },
          {
            pattern: new RegExp(/^[a-zA-Z ]{2,}$/i),
            message: "Please enter at least two characters!",
          },
        ]}
        name="first_name"
        className="w-full sm:ml-[200px]"
      >
        <div className="relative">
          <Input
            onBlur={onValid}
            onChange={(e) => handleInputChange(e, "first_name")}
            value={
              copyCompanyAddress
                ? businessInfo?.first_name
                : companyAddress?.first_name
            }
            className="fw-input"
          />
          <label htmlFor="floating_outlined" className="fw-label">
            First Name
          </label>
        </div>
      </Form.Item>
      <Form.Item
        rules={[
          {
            required: true,
            message: "Please enter your Last Name!",
          },
          {
            pattern: new RegExp(/^[a-zA-Z ]+$/i),
            message: "Please enter only alphabet characters!",
          },
          {
            pattern: new RegExp(/^[a-zA-Z ]{2,}$/i),
            message: "Please enter at least two characters!",
          },
        ]}
        name="last_name"
        className="w-full sm:ml-[200px]"
      >
        <div className="relative">
          <Input
            onBlur={onValid}
            onChange={(e) => handleInputChange(e, "last_name")}
            value={
              copyCompanyAddress
                ? businessInfo?.last_name
                : companyAddress?.last_name
            }
            className="fw-input"
          />
          <label htmlFor="floating_outlined" className="fw-label">
            Last Name
          </label>
        </div>
      </Form.Item>
      <Form.Item
        rules={[
          { required: true, message: "Please enter your Address Line 1!" },
        ]}
        name="address_1"
        className="w-full sm:ml-[200px]"
      >
        <div className="relative">
          <Input
            onBlur={onValid}
            onChange={(e) => handleInputChange(e, "address_1")}
            value={
              copyCompanyAddress
                ? businessInfo?.address_1
                : companyAddress?.address_1
            }
            className="fw-input"
          />
          <label htmlFor="floating_outlined" className="fw-label">
            Address Line 1
          </label>
        </div>
      </Form.Item>
      <Form.Item
        rules={[
          { required: false, message: "Please enter your Address Line 2!" },
        ]}
        name="address_2"
        className="w-full sm:ml-[200px]"
      >
        <div className="relative">
          <Input
            onBlur={onValid}
            onChange={(e) => handleInputChange(e, "address_2")}
            value={
              copyCompanyAddress
                ? businessInfo?.address_2
                : companyAddress?.address_2
            }
            className="fw-input"
          />
          <label htmlFor="floating_outlined" className="fw-label">
            Address Line 2
          </label>
        </div>
      </Form.Item>
      <Form.Item
        rules={[{ required: true, message: "Please enter your city!" }]}
        name="city"
        className="w-full sm:ml-[200px]"
      >
        <div className="relative">
          <Input
            onBlur={onValid}
            onChange={(e) => handleInputChange(e, "city")}
            value={
              copyCompanyAddress ? businessInfo?.city : companyAddress?.city
            }
            className="fw-input"
          />
          <label htmlFor="floating_outlined" className="fw-label">
            City
          </label>
        </div>
      </Form.Item>

      <Form.Item 
        name="state_code" 
        className="w-full sm:ml-[200px]"
        rules={[
          { 
            required: true,
            message: `Please enter your ${countryCode === "us" ? "State" : "Province/Region"}!`,
            validator: (_, value) => {
              // Skip validation if initial data hasn't loaded yet
              if (!isInitialDataLoaded) {
                return Promise.resolve();
              }

              if (!value) {
                return Promise.reject(new Error(`${countryCode === "us" ? "State" : "Province/Region"} is required`));
              }
              if (countryCode === "us") {
                // For US, ensure it's either a valid state name or code
                const isValidState = stateData.some(state => 
                  state.value === value.toLowerCase() || 
                  state.value === convertUsStateAbbrAndName(value)?.toLowerCase()
                );
                if (!isValidState) {
                  return Promise.reject(new Error('Please select a valid US state'));
                }
              }
              return Promise.resolve();
            }
          }
        ]}
      >
        <div className="relative">
          {countryCode === "us" ? (
            <Select
              allowClear
              showSearch
              onBlur={() => {
                // Only validate if initial data is loaded
                if (isInitialDataLoaded) {
                  onValid();
                }
              }}
              className="fw-input1"
              onChange={(value) => {
                onChangeState(value);
                // Only validate if initial data is loaded
                if (isInitialDataLoaded) {
                  form1.validateFields(['state_code']).catch(() => {
                    // Validation error is expected here
                  });
                }
              }}
              onSearch={(value) => {
                // Convert to uppercase for consistency
                const upperValue = value.toUpperCase();
                // If exactly 2 characters are entered and they're letters
                if (upperValue.length === 2 && /^[A-Z]{2}$/.test(upperValue)) {
                  const fullStateName = convertUsStateAbbrAndName(upperValue);
                  if (fullStateName) {
                    // Find the matching option and trigger onChange
                    const matchingOption = stateData.find(
                      option => option.value === fullStateName.toLowerCase()
                    );
                    if (matchingOption) {
                      onChangeState(matchingOption.value);
                    }
                  }
                }
              }}
              filterOption={(input, option) => {
                if (!option?.value) return false;
                // Check if input matches state code or state name
                const inputUpper = input.toUpperCase();
                const stateCode = convertUsStateAbbrAndName(option.value)?.toUpperCase() || '';
                return option.value.toLowerCase().includes(input.toLowerCase()) || 
                       (inputUpper.length === 2 && stateCode === inputUpper);
              }}
              options={stateData}
              value={
                companyAddress && !stateCode
                  ? billingInfo?.state_code &&
                    (billingInfo?.state_code.length === 2 
                      ? convertUsStateAbbrAndName(billingInfo?.state_code)?.toLowerCase()
                      : billingInfo?.state_code.toLowerCase())
                  : stateCode || ""
              }
              placeholder={`Select your ${countryCode === "us" ? "State" : "Province/Region"}`}
            />
          ) : (
            <Input
              className="fw-input"
              onBlur={() => {
                // Only validate if initial data is loaded
                if (isInitialDataLoaded) {
                  onValid();
                }
              }}
              value={stateCode || billingInfo?.province || ""}
              placeholder={`Enter your ${countryCode === "us" ? "State" : "Province/Region"}`}
              onChange={(e) => {
                const inputValue = e.target.value;
                
                if (countryCode === "us") {
                  // Convert to uppercase for consistency
                  const upperValue = inputValue.toUpperCase();
                  // If exactly 2 characters are entered and they're letters
                  if (upperValue.length === 2 && /^[A-Z]{2}$/.test(upperValue)) {
                    const fullStateName = convertUsStateAbbrAndName(upperValue);
                    if (fullStateName) {
                      setStateCode(fullStateName.toLowerCase());
                      setStateCodeShort(upperValue);
                      // Trigger validation
                      onValid();
                      return;
                    }
                  }
                  
                  // For full names or invalid 2-letter codes
                  const stateAbbr = convertUsStateAbbrAndName(inputValue);
                  setStateCode(inputValue);
                  setStateCodeShort(stateAbbr || inputValue);
                } else {
                  setStateCode(inputValue);
                  setStateCodeShort(inputValue);
                }
                // Only validate if initial data is loaded
                if (isInitialDataLoaded) {
                  form1.validateFields(['state_code']).catch(() => {
                    // Validation error is expected here
                  });
                }
              }}
            />
          )}
          <label htmlFor="floating_outlined" className="fw-label">
            {countryCode === "us" ? "State" : "Province/Region"}
          </label>
        </div>
      </Form.Item>

      <Form.Item
        name="zip_postal_code"
        className="w-full sm:ml-[200px]"
        rules={[
          { required: true, message: "Please enter your Zip!" },
          {
            pattern: new RegExp(/^[0-9]{2,7}$/),
            message: "Please enter a valid zip !",
          },
        ]}
      >
        <div className="relative">
          <InputNumber
            type="number"
            onBlur={onValid}
            onChange={(value) => handleInputChange(value, "zip_postal_code")}
            value={
              copyCompanyAddress
                ? businessInfo?.zip_postal_code
                : companyAddress?.zip_postal_code
            }
            className="fw-input"
          />
          <label htmlFor="floating_outlined" className="fw-label">
            Zip
          </label>
        </div>
      </Form.Item>

      <Form.Item
        name="phone"
        className="w-full sm:ml-[200px]"
        rules={[
          { required: true, message: "Please enter your Phone Number!" },
          {
            pattern: new RegExp(/^[0-9]{10,14}$/),
            message: "Please enter a valid phone number with at least 10 digits!",
          },
        ]}
      >
        <div className="relative">
          <Input
            value={
              copyCompanyAddress ? businessInfo?.phone : companyAddress?.phone
            }
            onBlur={onValid}
            onChange={(value) => handleInputChange(value, "phone")}
            className="fw-input"
          />
          <label htmlFor="floating_outlined" className="fw-label">
            Phone
          </label>
        </div>
      </Form.Item>
    </Form>
  );

  return (
    <div className="flex flex-wrap justify-center w-full h-full p-4 md:p-8">
      {/* Payment Methods Section */}
      <div className="w-full lg:w-1/2 mb-8 lg:mb-0 lg:pr-0 pt-20">
        <div className="bg-white p-6 rounded-lg shadow-sm border-2 border-dashed border-gray-200">
          <div className="flex flex-col items-center">
            <div className="w-full max-w-md bg-white rounded-lg mt-12">
              <PaymentMethods />
            </div>
          </div>
        </div>
      </div>

      {/* Billing Address Section */}
      <div className="w-full lg:w-1/2">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="mb-6 text-center mr-12">
            <h2 className="text-lg font-bold text-gray-600">
              My Billing Address
            </h2>
            <p className="text-gray-500 mt-2">
              You can change this info later within your account.
            </p>
            <div className="mt-4">
              <Checkbox className="text-gray-500" onChange={checkboxClick}>
                Check if same as company address
              </Checkbox>
            </div>
          </div>
          <div className="w-full">{displayTurtles}</div>
        </div>
      </div>
    </div>
  );
};

export default BillingAddress;
