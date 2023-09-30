export function userAuthTemplate(
  email: string,
  password: string,
  adminName: string,
) {
  return `
          <div
            style="
              background-color: #edf2f8;
              max-width: 600px;
              margin: 0 auto;
              font-family: Arial, Helvetica, sans-serif;
              color: rgb(66, 83, 78);
              padding: 15px;
            "
          >
            <h1
              style="
                font-size: 20px;
                margin-top: 0;
                text-align: center;
                font-weight: bold;
              "
            >
              TAX CO
            </h1>
            <div
              style="
                background-color: rgb(255, 255, 255);
                padding: 20px;
                font-size: 14px;
              "
            >
              <p style="margin-top: 0">Dear client,</p>
              <p style="margin-top: 0">
                ${
                  adminName ? adminName : 'Max'
                } from TAX CO created new account for you.
              </p>
              <div style="
                margin-bottom: 20px;
                border: 2px solid rgba(172, 172, 172, 0.4);
            ">
                <p
                    style="
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        margin: 0;
                        border-bottom: 2px solid rgba(172, 172, 172, 0.4);
                        padding: 10px;
                    "
                >
                    <span
                        style="
                            margin: 0 15px 0 0;
                            font-weight: bolt;
                        "
                    >Login:</span>
                    <span style="margin: 0">${email}</span>
                </p>
                <p
                    style="
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        margin: 0;
                        padding: 10px;
                    "
                >
                    <span
                        style="
                            margin: 0 15px 0 0;
                            font-weight: bolt;
                        "
                    >Psssword:</span>
                    <span style="margin: 0">${password}</span>
                </p>  
              </div>
              <a
                style="
                  display: block;
                  margin-bottom: 30px;
                  margin: 0 auto;
                  padding: 10px;
                  width: 240px;
                  background-color: rgb(28, 146, 91);
                  text-align: center;
                  color: white;
                  text-decoration: none;
                  border-radius: 6px;
                "
                href="https://docs.nestjs.com/"
                target="_blank"
              >
                Login into account
              </a>
            </div>
          </div>`;
}
