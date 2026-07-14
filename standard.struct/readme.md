HubClub Workflow @Config.json 离线激活指南
---

此操作指南将引导你在无法访问 _doc.maichc.club_ 、 _team.maichc.club_ 或 **离线不启动网络并入** 的前提下，将此 TUI 项目的标准化配置导入 HubClub 插件当中 —— 作为通用项目进行开发。

注：生效优先级依旧遵循 `[user:group]` 的发布规则。非 `maictext/[user:group]` 的私有自治架构，对于标准化发布可能并不适用于此指南。未激活状态统一为后者。



### 准备步骤
> hubclub.vsix 插件安装包不捆绑任何其他插件、软件，需要安装 Git 和 VSCode 两个软件。
1. `Git Clone` 此项目，务必确保 `.git` 隐藏文件夹的存在。（请提前在 VSCode 中配置好 Git）
2. 将 `hubclub.vsix` 拖动到 `VSCode` 当中进行安装。



### 项目导入

1. 核验 **远程仓库地址**（`git remote -v`） 和 **提交记录**（`git log --oneline`）是否与开源平台一致可信。
2. 在侧边栏的界面中找到 _workflow_ 配置，选择 **“作为工作流激活”**。此时将自动记录 id 和 Hash 值，初始化完成。
3. 右键 **standard.struct** 文件夹，选择 **“[hubclub] 链接到...”** 选项。使用 **“CSRPv0”** 解析 _install.qcr_ 文件即可完成自动导入。



### 备用在线方案
若始终无法识别或对操作不解，使用定向代码(推荐)： `tui@xml/standard.struct` 进行在线配置下载的自动化流程最终确认。如果社区可用，可在线获取 URL 进行配置。



### [附加提醒] XML 发布命名须知

为防止自定义命名与发布命名相冲突从而导致插件出错的自动回滚问题出现，下面摘要了部分 CSRPv0 的附件内容：

> maichc.club 的 XML 命名规范域是：http://xml.maichc.club。如果项目未上升到 offical 或 MaicPlay，默认使用个人命名空间 http://xml.maichc.club/@[用户名:组织] 或 http://xml.maichc.club/[uid] 的方式使用。