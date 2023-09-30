export function createTaskTemplate(
  mailTitle: string,
  firstName: string,
  email: string,
  task_list_name: string,
  task_title: string,
) {
  const clientName = firstName ? firstName : email;

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
            ${mailTitle}
        </p>
        <div
        style="
          border: 2px solid rgba(172, 172, 172, 0.4);
          margin-bottom: 20px;
        "
      >
        <p
          style="
            margin: 0;
            padding: 10px;
            text-align: center;
            font-weight: bold;
          "
        >
          ${task_list_name}
        </p>
        <p
        style="
          display: flex;
          align-items: center;
          margin: 0;
          border-top: 2px solid rgba(172, 172, 172, 0.4);
          padding: 10px;
        "
      >
        <span
            style="
              display: block;
              width: 16px;
              height: 16px;
              border: 2px solid rgba(66, 83, 78, 0.4);
              border-radius: 4px;
              margin-right: 15px;
            "
          ></span>
          <span style="text-transform: uppercase;">${task_title}</span>
      </p>
      </div>
        <p style="margin-top: 0; margin-bottom: 30px">
          Please go to your client portal to manage these tasks, send documents
          and ask your accountant questions.
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
