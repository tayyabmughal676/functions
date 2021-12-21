import * as functions from "firebase-functions";
import express from 'express';
import Stripe from 'stripe';

import { generateResponse } from './utils';

const app = express();



const getKeys = ()=> {
 return  { 'secret': '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', 'publish': 'pk_test_yBSEiOG7v3gQmDAbEyw0K4ue00TlejUUQH' };
}


app.post(
    '/create-payment-intent',
    async (req: express.Request, res: express.Response): Promise<void> => {
      const {
        email,
        currency,
        amount,
        request_three_d_secure,
        payment_method_types = [],
      }: {
        email: string;
        currency: string;
        amount: any;
        payment_method_types: string[];
        request_three_d_secure: 'any' | 'automatic';
      } = req.body;
  
  
      const stripe = new Stripe(getKeys().secret as string, {
        apiVersion: '2020-08-27',
        typescript: true,
      });
  
      const customer = await stripe.customers.create({ email });
      // Create a PaymentIntent with the order amount and currency.
      const params: Stripe.PaymentIntentCreateParams = {
        amount: amount,
        currency,
        customer: customer.id,
        payment_method_options: {
          card: {
            request_three_d_secure: request_three_d_secure || 'automatic',
          },
          sofort: {
            preferred_language: 'en',
          },
        },
        payment_method_types: payment_method_types,
      };
  
      try {
        const paymentIntent: Stripe.PaymentIntent = await stripe.paymentIntents.create(
          params
        );
        // Send publishable key and PaymentIntent client_secret to client.
        res.send({
          clientSecret: paymentIntent.client_secret,
        });
      } catch (error) {
        res.send({
          error: error.raw.message,
        });
      }
    }
  );


  app.post('/payment-sheet', async (_, res) => {
  
    const stripe = new Stripe(getKeys().secret as string, {
      apiVersion: '2020-08-27',
      typescript: true,
    });
  
    const customers = await stripe.customers.list();
  
    // Here, we're getting latest customer only for example purposes.
    const customer = customers.data[0];
  
    if (!customer) {
      res.send({
        error: 'You have no customer created',
      });
    }
  
    const ephemeralKey = await stripe.ephemeralKeys.create(
      { customer: customer.id },
      { apiVersion: '2020-08-27' }
    );
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 1099,
      currency: 'usd',
      customer: customer.id,
    });
    res.json({
      paymentIntent: paymentIntent.client_secret,
      ephemeralKey: ephemeralKey.secret,
      customer: customer.id,
    });
  });

