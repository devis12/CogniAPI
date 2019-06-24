<!--JavaScript JQuerylibrary is mandatory-->
<script src="/js/jquery-3.3.1.min.js"></script>
<!--JavaScript Popper-->
<script src="/js/popper.min.js"></script>
<!--JavaScript Bootstrap library-->
<script src="/js/bootstrap.min.js"></script>

<!-- javascript bootstrap toggle found here http://www.bootstraptoggle.com-->
<script src="/js/bootstrap-toggle.min.js"></script>

<!-- Datattable -->
<script src="https://cdn.datatables.net/1.10.19/js/jquery.dataTables.min.js"></script>
<script>
    $(document).ready( function () {
        $('#btable').DataTable();
    } );

    $('#btable').dataTable( {
        "pageLength": 500
    });
</script>

<!-- Footer management -->
<script src="js/footer.js"></script>