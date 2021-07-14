require("dotenv").config();
const express = require("express");
const app = express();
const port = 3000;

const axios = require("axios");
const cheerio = require("cheerio");
const nodemailer = require("nodemailer");
const mg = require("nodemailer-mailgun-transport");

const mailgunAuth = {
  auth: {
    api_key: process.env.MG,
    domain: "mg.imkant.com",
  },
};

const smtpTransport = nodemailer.createTransport(mg(mailgunAuth));

const mailOptions = {
  from: "amd@mg.imkant.com",
  to: "ryan.feigenbaum@gmail.com",
  subject: "AMD",
};

async function getAmd() {
  const { data } = await axios.get(
    "https://www.amd.com/en/direct-buy/products/us"
  );
  const $ = cheerio.load(data);
  const els = $(".views-row");

  const elArr = [];

  $(els).each(function (i, el) {
    const gpu = $(".shop-title", el).text();
    const stock = $(".shop-links", el).text();
    const link =
      "https://www.amd.com/" + $(".shop-full-specs-link > a", el).attr("href");
    console.log({ gpu, link: stock });
    const isInStockGpu = /Graphics/.test(gpu) && !/Out of Stock/.test(stock);

    if (isInStockGpu) {
      elArr.push({ gpu, link });
    }
  });

  if (elArr.length) {
    return elArr;
  } else {
    console.log("nil");
    return null;
  }
}

// setInterval(async () => {
//   const result = await getAmd();
//   if (result) {
//     smtpTransport.sendMail(
//       { ...mailOptions, text: JSON.stringify(result) },
//       function (error, response) {
//         if (error) {
//           console.log(error);
//         } else {
//           console.log("Successfully sent email.");
//         }
//       }
//     );
//   }
// }, 3000);

app.get("/", async (req, res) => {
  const result = await getAmd();
  res.json(result);
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
