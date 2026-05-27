/**
 * 単発 CLI 用の超軽量コンテキスト。
 *
 * モジュールのシグネチャを変えずに、現在実行中の route 名を client.ts から
 * 参照できるようにするためだけのもの。並行実行は前提にしていない
 * (CLI 1 起動 = 1 リクエスト)。
 *
 * サーバー化する場合は AsyncLocalStorage に置き換えること。
 */
let currentRoute: string | undefined;

export function setCurrentRoute(name: string | undefined): void {
  currentRoute = name;
}

export function getCurrentRoute(): string | undefined {
  return currentRoute;
}
