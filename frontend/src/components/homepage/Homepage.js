import React, { useState, useEffect } from 'react'
import Draggable from "react-draggable";
import labelmake from "labelmake/dist/lib/labelmake";
import axios from 'axios';
import Header from '../utils/header'
import Footer from '../utils/footer'
import './home.css'
import { pdfjs } from "react-pdf";
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;

const Homepage = () => {

    const user = JSON.parse(localStorage.getItem("user"));

    const d = new Date();
    // pdf to png
    const [pdf, setPdf] = useState("");
    const [pdfbase64, setPdfbase64] = useState("");
    const [width, setWidth] = useState(0);
    const [height, setHeight] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [pdfRendering, setPdfRendering] = useState("");
    const [pageRendering, setPageRendering] = useState("");
    const [pageList, setPageList] = useState([]);
    const [listItemWidth, setListItemWidth] = useState(0);
    const [listItemHeight, setListItemHeight] = useState(0);
    const [selectedPage, setSelectedPage] = useState({});
    const [pageNumber, setPageNumber] = useState(0);

    const [dataList, setdataList] = useState([]);
    const [showdatalist, setShowdatalist] = useState(false);

    // draggable
    const [addOption, setAddOption] = useState(1);
    const [item, setItem] = useState("");
    const [imageItem, setImageItem] = useState("");
    const [items, setItems] = useState(
        JSON.parse(localStorage.getItem("items")) || []
    );

    async function showPdf(event) {
        try {
            setPdfRendering(true);
            const file = event.target.files[0];
            const uri = URL.createObjectURL(file);
            var _PDF_DOC = await pdfjs.getDocument({ url: uri });
            setTotalPages(_PDF_DOC.numPages)
            setPdf(_PDF_DOC);

            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
                setPdfbase64(reader.result);
            };

            setPdfRendering(false);
            document.getElementById("file-to-upload").value = "";
        } catch (error) {
            alert(error.message);
        }
    }

    function changeViewPage(e) {
        setPageNumber(e);
        setSelectedPage(pageList[e - 1]);
    }

    function getDataList() {
        if(!showdatalist) {
            axios.post("http://localhost:6969/getdatalist", { user_id: user._id }).then(res => {
                setdataList(res.data);
                setShowdatalist(!showdatalist);
            })
        } else {
            setShowdatalist(!showdatalist);
        }
    }

    function loadData(id) {
        axios.post("http://localhost:6969/getdata", { _id: id }).then(res => {
            console.log(res.data)
            loadPdfData(res.data.template);
            setShowdatalist(!showdatalist);
        })
    }

    async function loadPdfData(templatedata) {
        try {
            // setPdfRendering(true);
            // var _PDF_DOC = await pdfjs.getDocument({ url: templatedata.basePdf });
            // setTotalPages(_PDF_DOC.numPages)
            // setPdf(_PDF_DOC);

            // setPdfbase64(templatedata.basePdf);
            // setPdfRendering(false);
            setItems(templatedata.schemas);

            document.getElementById("file-to-upload").value = "";
        } catch (error) {
            alert(error.message);
        }
    }

    async function renderPageList() {
        setPageList([]);
        let temparry = [];
        for (let index = 0; index < totalPages; index++) {
            temparry.push(index + 1);
        }
        await asyncForEach(temparry, async (item) => {
            setPageRendering(true);
            var page = await pdf.getPage(item);
            var viewport = page.getViewport({ scale: 1 });
            var render_context = {
                canvasContext: document.querySelector("#listrenderanvas").getContext("2d"),
                viewport: viewport
            };
            setListItemWidth(viewport.width);
            setListItemHeight(viewport.height);
            await page.render(render_context);
            var canvas = document.getElementById("listrenderanvas");
            var img = canvas.toDataURL("image/png");
            setPageList((pageList) => [...pageList, {
                page_num: item,
                img: img
            }]);

            if (item === 1) {
                setPageNumber(1);
                setSelectedPage(pageList[0]);
                var viewImage = document.getElementById("image-generated");
                viewImage.src = img;
            }
            setPageRendering(false);
        });
        async function asyncForEach(array, callback) {
            for (let index = 0; index < array.length; index++) {
                await callback(array[index], index, array);
            }
        }
    }

    useEffect(() => {
        setSelectedPage({});
        pdf && renderPageList();
        // eslint-disable-next-line
    }, [pdf]);

    const newitem = () => {
        if (item.trim() !== "" && pageNumber !== 0) {
            const newitem = {
                id: d.getTime(),
                item: item,
                position: { x: 0, y: 0 },
                type: "text",
                width: 40,
                height: 20,
                alignment: "center",
                fontSize: 20,
                fontColor: "#000",
                pageNumber: pageNumber
            };
            setItems((items) => [...items, newitem]);
            setItem("");
        } else {
            alert("Enter Label Name or open pdf file");
            setItem("");
        }
    };
    const addImage = (event) => {
        const file = event.target.files[0];
        let img = '';

        if (file && pageNumber !== 0) {
            let reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (e) => {
                img = e.target.result;
                setImageItem(img)
                const newitem = {
                    id: d.getTime(),
                    item: img,
                    position: { x: 0, y: 0 },
                    type: "image",
                    width: 20,
                    height: 20,
                    pageNumber: pageNumber
                };
                setItems((items) => [...items, newitem]);
                setItem("");
            }
        } else {
            alert("Choose image file or open pdf file.");
            setItem("");
        }
    };

    const keyPress = (event) => {
        var code = event.keyCode || event.which;
        if (code === 13) {
            newitem();
        }
    };

    useEffect(() => {
        localStorage.setItem("items", JSON.stringify(items));
    }, [items]);

    const updatePos = (data, index) => {
        console.log(items);
        let newArr = [...items];
        newArr[index].position = { x: (data.x / 3.77953), y: (data.y / 3.77953) };
        setItems(newArr);
    };

    const removeLabel = (id) => {
        setItems(items.filter((item) => item.id !== id));
    };

    async function preview(e) {
        let itemsArr = items;
        e.preventDefault();
        let temparry = [];
        let schemas = [];
        for (let index = 0; index < totalPages; index++) {
            temparry.push(index + 1);
            schemas.push({});
        }
        temparry.forEach((element, index) => {
            let schemas_p = itemsArr.filter((item) => {

                return item.pageNumber == element;
            });
            let schemas_o = schemas_p.reduce((a, v) => ({ ...a, [v.id]: v }), {});
            schemas[index] = schemas_o;
        });
        const template = {
            basePdf: pdfbase64,
            schemas: schemas
        };
        let input = itemsArr.reduce((a, v) => ({ ...a, [v.id]: v.item }), {});
        let inputs = [];
        inputs.push(input);

        const pdf = await labelmake({ template, inputs });
        const blob = new Blob([pdf.buffer], { type: "application/pdf" });
        document.getElementById("iframe").src = URL.createObjectURL(blob);

        document.getElementById('preview_pdf').style.display = 'block';
    }

    function saveDataPrev() {
        var template = {
            // basePdf: pdfbase64,
            schemas: []
        };
        var inputs = [];
        items.map((item) => {
            template.schemas.push(item);
        });
        console.log(user._id)
        const json_data = JSON.stringify({ template: template });
        document.getElementById("json_data").innerHTML = json_data;
        document.getElementById('preview_json_data').style.display = 'block';
    }

    function saveData() {
        var template = {
            // basePdf: pdfbase64,
            schemas: []
        };
        var inputs = [];
        items.map((item) => {
            template.schemas.push(item);
        });
        console.log(user._id)
        const json_data = JSON.stringify({ template: template });
        axios.post("http://localhost:6969/upload", { json_data: json_data, user_id: user._id }).then(res => {
            console.log(res.statusText)
            document.getElementById('preview_json_data').style.display = 'none';
        })
    }

    function removeData(e) {
        axios.post("http://localhost:6969/delete", { _id: e }).then(res => {
            console.log(res.statusText)
            setdataList(dataList.filter((item) => item._id !== e));
        })
    }

    function closePreview() {
        document.getElementById('preview_pdf').style.display = 'none';
    }

    function closeDataPreview() {
        document.getElementById('preview_json_data').style.display = 'none';
    }

    return (
        <>
            <Header />
            <div className='container-header'>
                <button
                    id="upload-button"
                    className='pdf-ctrl-btn'
                    onClick={() => document.getElementById("file-to-upload").click()}
                >
                    Select PDF
                </button>
                <input
                    type="file"
                    id="file-to-upload"
                    accept="application/pdf"
                    hidden
                    onChange={showPdf}
                />
                <div className='pdf-page-info'>
                    <div id="pdf-loader" hidden={!pdfRendering}>
                        Loading document ...
                    </div>
                </div>
                <div className="data-ctrl-btn">
                    <button className='pdf-ctrl-btn' onClick={(e) => preview(e)}>Preview PDF</button>
                    <button className='pdf-ctrl-btn' onClick={() => getDataList()}>Load Data</button>
                    <button className='pdf-ctrl-btn' onClick={() => saveDataPrev()}>Save Data</button>
                    {showdatalist && <div id='user-data-list'>
                        {dataList.map((item) => {
                            return (<div className="user-data-item" title="edit">
                                <div className="user-data-item-title" onClick={(e) => loadData(item._id)}>
                                    {`${item._id}`}
                                </div>
                                <button className="removeBtn" onClick={(e) => removeData(item._id)}>Remove</button>
                            </div>);
                        })}
                    </div>}
                    {/* <a href={} id='get_json'></a> */}
                </div>
            </div>
            <div id="container">
                <div className='pdf-page-list'>
                    <div id='page-list-container'>
                        <canvas id="listrenderanvas" width={listItemWidth} height={listItemHeight}></canvas>
                        {pageList && pageList.map((item) => {
                            return (
                                <div className="page-list-content">
                                    <div className="pageListNumber">{item.page_num}</div>
                                    <div className="image-list-convas-row" onClick={() => changeViewPage(item.page_num)}>
                                        {item.img && (
                                            <img
                                                src={item.img}
                                                alt="pdfImage"
                                            />
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                        <div id="page-loader" hidden={!pageRendering}>
                            Loading page ...
                        </div>
                    </div>
                </div>
                <div className='items-start'>
                    Page: {pageNumber}
                    <div className='pdf_view'>
                        <div id="pdf-main-container">
                            <div id="pdf-contents">
                                <div id="image-convas-row">
                                    {selectedPage &&
                                        <img
                                            id="image-generated"
                                            src={selectedPage.img}
                                            alt="pdfImage"
                                            style={{ width: width, height: height }}
                                        />
                                    }
                                    {!selectedPage &&
                                        <img
                                            id="image-generated"
                                            src={''}
                                            alt="pdfImage"
                                            style={{ width: width, height: height }}
                                        />
                                    }
                                </div>
                                <div id="page-loader" hidden={!pageRendering}>
                                    Loading page ...
                                </div>
                                {items.map((item, index) => {
                                    return item.pageNumber == pageNumber && (
                                        <Draggable
                                            key={item.id}
                                            defaultPosition={{ x: item.position.x * 3.77953, y: item.position.y * 3.77953 }}
                                            onStop={(e, data) => {
                                                updatePos(data, index);
                                            }}
                                        >
                                            <div className="box">
                                                {item.type === 'text' ?
                                                    `${item.item}` :
                                                    <img src={item.item} width={item.width * 3.77953} height={item.height * 3.77953} alt='Label Image' />
                                                }
                                            </div>
                                        </Draggable>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>

                <div id="toolbar">
                    Label Controls
                    <div id="labels-container">
                        {items.map((item) => {
                            return item.pageNumber == pageNumber && (
                                <div id={item.id} className="label-item" title="edit">
                                    <div className="label-item-titlle">
                                        {`${item.id}`}
                                    </div>
                                    <button className="removeBtn" onClick={(e) => removeLabel(item.id)}>Remove</button>
                                </div>
                            );
                        })}
                    </div>
                    <div className='add-option'>
                        <select value={addOption} onChange={(e) => setAddOption(e.target.value)}>
                            <option value="1">Text</option>
                            <option value="2">Image</option>
                        </select>
                    </div>
                    <div className="add-label">
                        {addOption == 2 ?
                            <>
                                <button
                                    className='addImgLabelBtn'
                                    onClick={() => document.getElementById("add-image-label").click()}
                                >
                                    Add Image
                                </button>
                                <input
                                    type="file"
                                    id="add-image-label"
                                    accept="image/gif, image/jpg, image/jpeg, image/png"
                                    hidden
                                    onChange={addImage}
                                />
                                <img src={imageItem} maxHeight='40' alt='Preview' />
                            </> :
                            <>
                                <input
                                    value={item}
                                    name='label_name'
                                    onChange={(e) => setItem(e.target.value)}
                                    placeholder="Label Name"
                                    onKeyPress={(e) => keyPress(e)}
                                />
                                <button id="addLabelBtn" className='addLabelBtn' onClick={newitem}>Add Label</button>
                            </>
                        }
                    </div>
                </div>
            </div>
            <div id='preview_pdf'>
                <div className='preview_pdf_content'>
                    <iframe id="iframe" width="1200" height="900"></iframe>
                    <button className='close_preview' onClick={closePreview} title='Close Preview'>X</button>
                </div>
            </div>
            <div id='preview_json_data'>
                <div className='preview_json_data_modal'>
                    <div className='preview_json_data_header'>
                        JSON Data
                        <button className='close_data_preview' onClick={closeDataPreview} title='Close Preview'>X</button>
                    </div>
                    <div className='preview_json_data_content'>
                        <div id="json_data" width="1200" height="900"></div>
                    </div>
                    <button className='save_data' onClick={saveData} title='Save Data'>Save Data</button>
                </div>
            </div>
            <Footer />
        </>
    )
}

export default Homepage;
