export function taskItemTemplate(task_title: string) {
  return `<p
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
    </p>`;
}
