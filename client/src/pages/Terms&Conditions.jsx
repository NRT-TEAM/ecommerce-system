import React from "react";

const TermsConditions = () => {
  const content = `LEWIS, a division of Lewis Stores (Pty) Ltd is giving away one product per lucky customer.

The prize will be the item(s) selected when entering the competition. If stock is not available, Lewis staff will inform the winner of an alternative prize in either the same product category or to the same value.

The winner of the competition will be drawn via a random selection process within the week of entering and the winner will be notified via e-mail, SMS or telephonically (on the mobile number used to enter the competition) shortly thereafter.

The prize will be couriered to the winner or may be collected in store as soon as the LEWIS store closest to the winner is open for business, stock is available and the winner's address details have been confirmed.

The competition is only available to residents in South Africa, Botswana, Lesotho, Namibia and Eswatini, aged 18 and over.

Entrants may only enter the competition once. You may NOT enter the competition more than once by using multiple phone numbers or by any other means. If you enter the competition more than once, all of your submissions will be removed, and you will no longer by eligible to participate in the competition.

If the prize includes a TV, the winner needs to provide a valid TV license to Lewis staff.

By entering this competition, you consent to your contact details being retained on our database and further consent to receiving marketing related communication from Lewis Stores (Pty) Ltd or any of its affiliate/subsidiary entities ("Lewis Stores (Pty) Ltd").

Should you win the competition, you expressly consent to your name and details of your entry into the competition being disclosed on our media channels. For example, brochure, website, social media, radio and other platforms.

If we are unable to contact the winner after 3 attempts over 7 calendar days, such winner will forfeit their prize and have no claim in respect of such prize and/or damages arising therefrom, whether foreseen or unforeseen, against Lewis Stores (Pty) Ltd. Upon forfeiture we may, at our sole discretion, elect to draw another winner by means of the random selection process.

By entering the competition, you agree and understand that you MAY win the prize and that there is no guarantee that you will win the prize.

Any person who is a director, member, partner, employee, agent of or consultant to Lewis Stores (Pty) Ltd, its subsidiaries, divisions and/or associated or holding companies or any other person who directly or indirectly controls or is controlled by Lewis Stores (Pty) Ltd and their spouses, life partners, immediate family members and business partners may not participate in the competition.

The prize will not be exchangeable for cash and any portion of the prize not used, will not be refunded to the winner.

By entering the competition, you agree to these terms and conditions of the competition.

Any personal data relating to Winners or Entrants will be used solely in accordance with the Consumer Protection Act and Protection of Personal Information Act and will not be disclosed to any third party without the Winner or Entrants prior consent.

By partaking in the competition, Entrant's consent to their personal information being shared with Lewis Stores (Pty) Ltd employees, contractors or agents necessary for purposes of administering this competition.

Lewis's privacy policy and conditions of use can be viewed on its website at lewisstores.co.za`;

  const paragraphs = content.split(/\n\s*\n/);

  return (
    <div className="container mx-auto px-4 py-12" data-testid="terms-page">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight" data-testid="terms-title">
            Lewis Stores Competition Terms & Conditions
          </h1>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 md:p-8" data-testid="terms-content">
          <div className="space-y-4">
            {paragraphs.map((p, i) => (
              <p key={i} className="text-gray-700 leading-relaxed" data-testid={`terms-paragraph-${i+1}`}>
                {p}
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsConditions;
