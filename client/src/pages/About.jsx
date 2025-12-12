import React, { useEffect, useState } from "react";

const CountUp = ({ to, duration = 1500, prefix = "", suffix = "" }) => {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let start = 0;
    const startTime = performance.now();
    const step = (now) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const current = Math.floor(progress * to);
      if (current !== start) {
        start = current;
        setVal(current);
      }
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [to, duration]);
  return (
    <span>
      {prefix}
      {val.toLocaleString()}
      {suffix}
    </span>
  );
};

const About = () => {
  return (
    <div className="container mx-auto px-4 py-8 fade-in-up">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold mb-6">The Lewis Group</h1>
        <p className="mb-6 text-gray-700">
          The Lewis Group is a leading retailer of household furniture,
          electrical appliances and home electronics.
        </p>
        <p className="mb-6 text-gray-700">
          Lewis Stores is a subsidiary of the Lewis Group (which also includes
          the Best Home and Electric, UFO, Inspire and Beares brands). The
          retail brands are supported by the financial services arm, Monarch
          Insurance, which provides insurance to the group's credit customers.
        </p>

        <h2 className="text-2xl font-semibold mb-4">
          Top seven things you should know
        </h2>
        <ul className="space-y-2 mb-8 text-gray-700">
          <li>
            We're established - our doors first opened in Cape Town 76 years
            ago.
          </li>
          <li>
            We're reliable and trusted - over 700 000 people trust Lewis to
            furnish their homes with quality service.
          </li>
          <li>
            We're accountable - we've been listed on the JSE Limited since 2004.
          </li>
          <li>
            We're accessible - find Lewis in 499 stores throughout Southern
            Africa.
          </li>
          <li>
            We care - whether building schools or donating products, we make a
            difference in our communities.
          </li>
          <li>We offer same day delivery.</li>
          <li>
            We are transparent - our advertising includes all compulsory costs
            in the monthly instalment.
          </li>
        </ul>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
          <div className="p-6 text-center">
            <div className="text-3xl font-bold">
              <CountUp to={76} suffix="+" />
            </div>
            <div className="text-gray-600">Years Established</div>
          </div>
          <div className="p-6 text-center">
            <div className="text-3xl font-bold">
              <CountUp to={700000} />
            </div>
            <div className="text-gray-600">Trusted Customers</div>
          </div>
          <div className="p-6 text-center">
            <div className="text-3xl font-bold">
              <CountUp to={499} />
            </div>
            <div className="text-gray-600">Stores in Southern Africa</div>
          </div>
          <div className="p-6 text-center">
            <div className="text-3xl font-bold">
              <CountUp to={2004} />
            </div>
            <div className="text-gray-600">Listed Since</div>
          </div>
        </div>

        <h2 className="text-2xl font-semibold mb-4">Who Are We?</h2>
        <p className="mb-6 text-gray-700">
          Lewis Stores is South Africa's largest furniture retail brand. If you
          need anything from a lounge suite or dining-room table to a
          state-of-the-art fridge or home theatre system - we can help you.
        </p>
        <p className="mb-6 text-gray-700">
          With 431 stores located all over South Africa, plus 68 stores
          scattered through Botswana, Lesotho, Namibia and Swaziland, there is a
          store near you. We're easy to find, just pop down your main road or
          town centre and look for the familiar red and white Lewis sign.
        </p>
        <p className="mb-6 text-gray-700">
          Lewis stores vary in size with the larger stores carrying our full
          range of products, and the smaller ones carrying a selection of our
          most popular items. The smaller stores do, however, still give you
          access to all that Lewis has to offer through an innovative electronic
          catalogue. If you find something in the catalogue that your local
          store doesn't have in stock, they will order it for you and you'll
          have it in your home within a few days.
        </p>
        <p className="mb-6 text-gray-700">
          Browse through our live electronic catalogue or visit your nearest
          store to find home furniture and appliances that will enhance your
          home. All our products can be bought on credit and we will give you a
          response to your credit application in under 15 seconds.
        </p>
      </div>
    </div>
  );
};

export default About;
