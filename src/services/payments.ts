import HttpClient from './http-client';

export interface ITransactionRequest {
  amount: string;
  paymentMethodNonce?: string | undefined;
  deviceData?: string | undefined;
}
export interface ITransactionResponse {
  id: string;
  status: string;
  type: string;
  currencyIsoCode: string;
  amount: string;
  merchantAccountId: string;
  orderId: string;
  createdAt: string;
  updatedAt: string;
}
export interface IBraintreeToken {
  token: string;
}
export default class PaymentHttpClient {
  /**
   * Generate Token
   * @returns
   */
  public static async generateToken(): Promise<IBraintreeToken> {
    // generate token
    const {
      data: { token },
    } = await HttpClient.get('/get-client-token');
    const braintreeToken: IBraintreeToken = { token };
    console.log('braintreeToken....', braintreeToken)
    return braintreeToken;
  }

  /**
   * Checkout Transaction
   * @param payload
   * @returns
   */
  public static async checkout(
    payload: ITransactionRequest
  ): Promise<ITransactionResponse> {
    // checkout API
    const {
      data: {
        id,
        status,
        type,
        currencyIsoCode,
        amount,
        merchantAccountId,
        orderId,
        createdAt,
        updatedAt,
      },
    } = await HttpClient.post('/payment/checkout', payload);
    const response: ITransactionResponse = {
      id,
      status,
      type,
      currencyIsoCode,
      amount,
      merchantAccountId,
      orderId,
      createdAt,
      updatedAt,
    };
    console.log('response....', id)
    return response;
  }

  /**
  * Add Payment Method
  * @param payload
  * @returns
  */
  public static async addPaymentMethod(
    payload: any
  ) {
    console.log('payload....', payload)
    const response = await HttpClient.post('/add-payment-card', payload);
    if (response) {
      console.log('response....', response)
    }
    return response;
  }
}