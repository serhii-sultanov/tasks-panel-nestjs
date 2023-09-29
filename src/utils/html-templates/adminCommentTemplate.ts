export function adminCommentTemplate(
  firstName: string,
  email: string,
  adminName: string,
  task_title: string,
) {
  const clientName = firstName ? `${firstName}` : email;

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
        <p style="margin-top: 0">Hello ${clientName},</p>
        <p style="margin-top: 0">
          ${
            adminName ? adminName : 'Max'
          } from TAX CO left comment into your task - "${task_title}".
        </p>
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
          View and Manage Tasks
        </a>
      </div>
    </div>`;
}
