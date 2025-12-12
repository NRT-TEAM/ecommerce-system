import React from "react";

const RefundPolicy = () => {
  const content = `We wish you to be completely satisfied with your order. If you are not happy with your order, please refer to the options below. We are committed to treating our valued customers fairly and accordingly comply with the applicable consumer protection laws.

5 Business Days Refund Policy
If you change your mind or are unhappy with your purchase for any reason. Let our customer service team know within 5 business days of purchase. We will gladly collect at our expense and provide you with a refund. We will do so if the item is in its original condition (i.e. it has not been used, and it has all its instructions, accessories and parts) and it is in its original packaging (if applicable). Please retain your receipt or invoice as proof of purchase.

A few things are excluded from this refund policy:

Goods purchased by way of special arrangement or custom order will only be refunded/replaced if defective; and
Goods that were sold as damaged, defective, used or repaired items, where we informed you of their condition at the time of purchase, will not be refunded/replaced.
Goods Bought for a Particular Purpose
If you advised the salesperson that you needed the goods for a particular purpose, and the salesperson confirmed that you would be able to use the goods for that purpose. If it turned out that the goods were unsuitable for that purpose. You may return the goods for a full refund within 10 business days after you purchased them.

No Chance to Examine Goods before Delivery
If you did not have the opportunity to examine the goods before taking delivery of them and it turns out that they are not of the type or quality that you had reasonably expected or if in the case of special-order goods, the goods do not reasonably conform to the material specifications of the order. You may return these goods for a full refund within 10 business days after you purchased them.

Cost of Returning the Goods
In most cases, we will cover the cost of returning the Goods to us. In certain circumstances however, we reserve the right to charge you a reasonable amount for the restoration costs necessary to make the goods fit for re-stocking again.

Defective Goods - One Year Guarantee
If during the first 6 months after your purchase, you discover that your goods are defective or faulty, please contact your branch. We will collect the goods at our expense and at your election, repair or replace the goods or refund you. This is in line with the first 6 month statutory warranty period in terms of the Consumer Protection Act of 2008 (the CPA).

If a defect is discovered after the first 6 month statutory warranty period but within the 1 year manufacturer's guarantee period. We will collect the goods and have them technically assessed to determine whether the goods can be repaired or replaced. For large appliances, we may arrange for the assessment to take place at your home. This is in line with the second 6 month statutory warranty period in terms of the Consumer Protection Act.

3 Month Repair Warranty
If we repair an item for you as a result of a claim brought during the first 6 month statutory warranty period, and within 3 months after the repair, the defect has not been properly fixed or a further defect is discovered, then we will replace the item or refund you.

Two Year Extended Warranty
If a defect is discovered after the 1 year manufacturer's guarantee expires, and you purchased a 2 year extended warranty from us, the terms of the extended warranty agreement will apply in respect of the repair or replacement of your goods.

If a defect is discovered after the 1 year manufacturer's guarantee expires and you did not purchase a 2 year extended warranty from us or the extended warranty has expired, we may still be able to arrange to have the goods repaired (if possible), but it will be at your own cost. Any such repair work will be subject to you first agreeing to a repair quotation.

Exclusions to the Manufacturer's Guarantee
The manufacturer's guarantee will only apply in respect of defects (material imperfections) that occur during the manufacturing process. For example, it will not apply if the damage occurs as a result of:

accidental damage;
faults resulting from normal wear and tear;
lightening or power surges or sea air corrosion;
neglect, misuse or abuse;
using the goods contrary to manufacturer’s instructions and terms of use;
unauthorized alterations to the goods;
using the goods for industrial or commercial use.
*Please note it would be fraudulent to damage goods deliberately to claim a refund.
Timing for Repairs
We will do our best to repair the defective goods, or replace them within 30 days. However, if it takes longer, we will contact you to let you know what is happening (e.g. if our repair agent has to order necessary parts or if our suppliers are out of stock).

Cancellation of Orders
We reserve the right to cancel an order for which payment has already been received. This may occur, for example, if we have stock shortages. Should we do so, you will receive a full refund.

Customer Care Department Contact Details
Any complaints regarding the standard and quality of our goods should be directed to our Customer Care Department:

Toll-free number: 0800 228 444

Email address: customersupport@lewisgroup.co.za

Address: Lewis Customer Care Department, Universal House, 53A Victoria Road, Woodstock, 7925

Dispute resolution
If we do not accept that we supplied defective or unsuitable goods, and our Customer Care Department has not been able to help, you may refer the matter to the Consumer Goods and Services Ombud:

Sharecall: 0860 000 272

Email: info@cgso.org.za

*This policy does not exclude any other rights that you may have.`;

  const paragraphs = content.split(/\n\s*\n/);

  return (
    <div className="container mx-auto px-4 py-12" data-testid="refund-policy-page">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight" data-testid="refund-policy-title">
            Returns / Refund Policy
          </h1>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 md:p-8" data-testid="refund-policy-content">
          <div className="space-y-4">
            {paragraphs.map((p, i) => (
              <p key={i} className="text-gray-700 leading-relaxed" data-testid={`refund-policy-paragraph-${i+1}`}>
                {p}
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RefundPolicy;
