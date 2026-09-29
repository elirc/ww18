import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import {loadTypeScript} from './helpers/load-typescript.mjs';
const m=await loadTypeScript('src/domain/quote-policy.ts',{root:path.resolve('.')});
const product={id:'p1',sku:'SKU-1',basePriceCents:10000,dealDeskDiscountPct:20,autoApprovalDiscountPct:10,priceRules:[{id:'r1',minQuantity:1,maxQuantity:10,floorPriceCents:6000,allowedTermMonths:[12]}]};
const line=(price,quantity=2)=>({productId:'p1',quantity,unitPriceCents:price});
test('listed lifecycle edges permit direct approval, routed approval and conversion',()=>{
 for(const [from,to] of [['DRAFT','APPROVED'],['DRAFT','PENDING_DEAL_DESK'],['PENDING_DEAL_DESK','PENDING_APPROVAL'],['PENDING_APPROVAL','APPROVED'],['APPROVED','CONVERTED_TO_ORDER']])assert.doesNotThrow(()=>m.ensureQuoteTransition(from,to));
});
test('terminal, skipped and same-status moves produce real statusCode 409',()=>{
 for(const [from,to] of [['REJECTED','APPROVED'],['CONVERTED_TO_ORDER','DRAFT'],['DRAFT','CONVERTED_TO_ORDER'],['APPROVED','APPROVED']])assert.throws(()=>m.ensureQuoteTransition(from,to),e=>e.statusCode===409&&e.message.includes(from)&&e.message.includes(to));
});
test('exact thresholds preserve cents totals and use strict greater-than routing',()=>{
 const exactFinance=m.evaluateQuoteDraft([product],[line(9000)],12);assert.equal(exactFinance.subtotalCents,20000);assert.equal(exactFinance.totalCents,18000);assert.equal(exactFinance.discountCents,2000);assert.equal(exactFinance.lines[0].discountPct,10);assert.equal(exactFinance.requiresFinanceApproval,false);assert.equal(exactFinance.requiresDealDesk,false);assert.equal(exactFinance.requiresLegalApproval,false);
 const exactDesk=m.evaluateQuoteDraft([product],[line(8000)],12);assert.equal(exactDesk.requiresDealDesk,false);assert.equal(exactDesk.requiresFinanceApproval,true);assert.equal(exactDesk.lines[0].pricingRuleId,'r1');
});
test('above-threshold discount and nonstandard term produce deduplicated review reasons',()=>{
 const result=m.evaluateQuoteDraft([product],[line(7900),line(7900,1)],24);assert.equal(result.totalCents,23700);assert.equal(result.discountCents,6300);assert.equal(result.requiresDealDesk,true);assert.equal(result.requiresFinanceApproval,true);assert.equal(result.requiresLegalApproval,true);assert.equal(result.reasons.length,3);assert.equal(new Set(result.reasons).size,3);
});
test('unknown product and below-floor price refuse while exact floor remains permitted',()=>{
 assert.throws(()=>m.evaluateQuoteDraft([], [line(9000)],12),e=>e.statusCode===404);
 assert.throws(()=>m.evaluateQuoteDraft([product],[line(5999)],12),e=>e.statusCode===422);
 assert.doesNotThrow(()=>m.evaluateQuoteDraft([product],[line(6000)],12));
});
