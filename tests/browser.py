"""Validação ponta a ponta da distribuição de produção com Playwright Python."""
import socket
import subprocess
import time
from pathlib import Path
from urllib.request import urlopen

from playwright.sync_api import expect, sync_playwright

ROOT = Path(__file__).resolve().parents[1]


def journey(browser, base, mobile):
    ctx = browser.new_context(
        viewport={"width": 390 if mobile else 1440, "height": 900},
        has_touch=mobile, reduced_motion="reduce",
    )
    page = ctx.new_page()
    errors = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    page.on("console", lambda msg: errors.append(msg.text) if msg.type == "error" else None)
    page.goto(base)
    button = lambda name: page.get_by_role("button", name=name, exact=True)
    expect(page.get_by_role("heading", name="Construtor de raquetes")).to_be_visible()
    expect(page.locator("canvas")).to_be_visible()
    assert page.locator(".workbench").evaluate("(el) => getComputedStyle(el).gridTemplateColumns.split(' ').length") == (1 if mobile else 2)
    expect(page.get_by_text("175 g", exact=True)).to_be_visible()
    page.get_by_label("Espessura Forehand").select_option("2.1")
    expect(page.get_by_text("176 g", exact=True)).to_be_visible()
    page.get_by_label("Dureza Forehand").select_option("36")
    canvas = page.locator(".scene canvas")
    before = canvas.screenshot()
    box = canvas.bounding_box()
    x, y = box["x"] + box["width"] / 2, box["y"] + box["height"] / 2
    if mobile:
        cdp = ctx.new_cdp_session(page)
        for kind, points in [("touchStart", [{"x": x, "y": y}]), ("touchMove", [{"x": x+70, "y": y+20}]), ("touchEnd", [])]:
            cdp.send("Input.dispatchTouchEvent", {"type": kind, "touchPoints": points})
        cdp.detach()
    else:
        page.mouse.move(x, y)
        page.mouse.down()
        page.mouse.move(x+70, y+20, steps=6)
        page.mouse.up()
    assert canvas.screenshot() != before
    button("Verso").click()
    expect(button("Verso")).to_have_attribute("aria-pressed", "true")
    assert canvas.screenshot() != before
    button("Camadas").click()
    button("Aproximar").click()
    button("Afastar").click()
    button("Restaurar câmera").click()
    expect(button("Frente")).to_have_attribute("aria-pressed", "true")
    button("Reiniciar montagem").click()
    button("Remover todas as peças").click()
    expect(page.get_by_text("Faltam 3.", exact=False)).to_be_visible()
    button("Escolher Madeira").click()
    page.get_by_label("Nome ou fabricante").fill("não existe xyz")
    expect(page.get_by_text("Nenhum equipamento encontrado.", exact=False)).to_be_visible()
    page.get_by_label("Nome ou fabricante").fill("genérica ALL")
    page.get_by_role("button", name="Madeira genérica ALL", exact=False).click()
    for slot, item in [("Forehand", "Tenergy 05"), ("Backhand", "Rozena")]:
        button("Busca rápida de equipamentos").click()
        page.get_by_label("Nome ou fabricante").fill(item)
        button("Usar " + item + " em " + slot).click()
    button("Remover Backhand").click()
    button("Escolher Backhand").click()
    page.get_by_role("button", name="Rozena", exact=False).click()
    button("Salvar montagem").click()
    page.get_by_label("Nome da montagem").fill("Treino")
    button("Salvar neste navegador").click()
    button("Compartilhar").click()
    link = page.get_by_label("Link para esta configuração").input_value()
    page.goto(link)
    expect(page.get_by_role("heading", name="Madeira genérica ALL")).to_be_visible()
    button("Melhorar montagem").click()
    page.get_by_label("Prioridade").select_option("Peso")
    button("Buscar recomendações").click()
    expect(page.get_by_role("heading", name="Relatório da busca")).to_be_visible()
    button("Aplicar ao construtor").click()
    button("Explorar").click()
    page.get_by_label("Estilo", exact=True).select_option("OFF+")
    slider = page.get_by_role("slider").first
    slider.focus()
    slider.press("ArrowLeft")
    page.get_by_label("Orçamento máximo", exact=False).fill("1")
    button("Buscar recomendações").click()
    expect(page.get_by_text("Nenhuma alternativa atende", exact=False)).to_be_visible()
    page.get_by_label("Orçamento máximo", exact=False).fill("3000")
    page.get_by_label("Manter a madeira atual").uncheck()
    page.get_by_label("Modelos de borracha").select_option("diferentes")
    button("Buscar recomendações").click()
    options = page.locator(".ranklist button")
    expect(options.nth(1)).to_be_visible()
    options.nth(1).click()
    expect(options.nth(1)).to_have_attribute("aria-pressed", "true")
    page.get_by_text("Comparar os nove indicadores").click()
    expect(page.get_by_role("table")).to_be_visible()
    page.evaluate("window.print=()=>{window.printTest=true}")
    button("Imprimir / PDF").click()
    assert page.evaluate("window.printTest")
    assert page.pdf().startswith(b"%PDF")
    button("Aplicar ao construtor").click()
    expect(page.get_by_role("status")).to_contain_text("Recomendação aplicada")
    button("Biblioteca").click()
    button("Treino").click()
    expect(page.get_by_role("heading", name="Madeira genérica ALL")).to_be_visible()
    page.goto(base + "?r=invalido")
    expect(page.get_by_role("status")).to_contain_text("Link inválido")
    assert page.evaluate("document.documentElement.scrollWidth <= window.innerWidth")
    page.evaluate("localStorage.setItem('ttlab:library:v1', 'corrompido')")
    button("Biblioteca").click()
    expect(page.get_by_role("alert")).to_contain_text("Não foi possível ler")
    page.keyboard.press("Escape")
    expect(page.get_by_role("dialog")).to_have_count(0)
    assert not errors, errors
    ctx.close()


def main():
    with socket.socket() as sock:
        sock.bind(("127.0.0.1", 0))
        port = sock.getsockname()[1]
    base = f"http://127.0.0.1:{port}/"
    server = subprocess.Popen(
        ["node", "node_modules/vite/bin/vite.js", "preview", "--host", "127.0.0.1",
         "--strictPort", "--port", str(port)], cwd=ROOT,
    )
    try:
        for _ in range(100):
            try:
                with urlopen(base, timeout=1):
                    break
            except OSError:
                time.sleep(0.1)
        with sync_playwright() as p:
            browser = p.chromium.launch(args=["--enable-unsafe-swiftshader"])
            for mobile in (False, True):
                journey(browser, base, mobile)
                print("Fluxo aprovado:", "mobile" if mobile else "desktop", flush=True)
            page = browser.new_page()
            page.add_init_script("""const orig=HTMLCanvasElement.prototype.getContext;
                HTMLCanvasElement.prototype.getContext=function(type,...args){
                return type.startsWith('webgl') ? null : orig.call(this,type,...args)}""")
            page.goto(base)
            expect(page.get_by_text("Prévia 2D", exact=False)).to_be_visible()
            print("Fallback WebGL aprovado")
            browser.close()
    finally:
        server.terminate()
        server.wait()


if __name__ == "__main__":
    main()
