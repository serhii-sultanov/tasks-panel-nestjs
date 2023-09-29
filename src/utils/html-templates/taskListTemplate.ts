export function taskListTemplate(task_list_name: string, taskTemplate: string) {
  return `<div
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
        ${taskTemplate}
    </div>`;
}
